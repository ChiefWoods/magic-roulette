"use client";

import { parseBN, ParsedRound, Round } from "@/types/accounts";
import { wrappedFetch } from "@/lib/api";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import useSWR, { KeyedMutator } from "swr";
import { useTable } from "./TableProvider";
import { BN } from "@coral-xyz/anchor";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { parseLamportsToSol, timestampToMilli } from "@/lib/utils";
import { useTime } from "./TimeProvider";
import { useBets } from "./BetsProvider";
import { isWinner, payoutMultiplier } from "@/lib/betType";
import { toast } from "sonner";
import { MagicRouletteClient } from "@/classes/MagicRouletteClient";
import { MAGIC_ROULETTE_CLIENT } from "@/lib/client/solana";

interface RoundsContextType {
  roundsData: ParsedRound[] | undefined;
  roundsLoading: boolean;
  roundsMutate: KeyedMutator<ParsedRound[]>;
  roundEndsInSecs: number;
  isRoundOver: boolean;
  currentRound: ParsedRound | null;
  lastRoundOutcome: number | null;
}

const RoundsContext = createContext<RoundsContextType>({} as RoundsContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/rounds`;

export function useRounds() {
  return useContext(RoundsContext);
}

export function RoundsProvider({
  children,
  fallbackData,
}: {
  children: ReactNode;
  fallbackData: ParsedRound[];
}) {
  const {
    data: roundsData,
    isLoading: roundsLoading,
    mutate: roundsMutate,
  } = useSWR(
    "rounds",
    async () => {
      const newUrl = new URL(apiEndpoint);

      const rounds = (await wrappedFetch(newUrl.href)).rounds as ParsedRound[];

      return rounds;
    },
    {
      fallbackData,
      revalidateOnMount: false,
      keepPreviousData: true,
    }
  );
  const { tableData, tableMutate } = useTable();
  const { betsData } = useBets();
  const { publicKey } = useUnifiedWallet();
  const { connection } = useConnection();
  const { time } = useTime();

  const roundEndsInSecs = useMemo(() => {
    return tableData
      ? timestampToMilli(Number(tableData.nextRoundTs)) - time.getTime()
      : Infinity;
  }, [tableData, time]);

  const isRoundOver = roundEndsInSecs <= 0;

  const isNotFirstRound =
    tableData && new BN(tableData.currentRoundNumber).gtn(1);

  const currentRound =
    roundsData && tableData
      ? roundsData.find(
          (round) => round.roundNumber === tableData.currentRoundNumber
        ) || null
      : null;

  const lastRoundOutcome = useMemo(() => {
    if (roundsData && isNotFirstRound) {
      const lastRoundNumber = new BN(tableData.currentRoundNumber).subn(1);

      const lastRoundAcc = roundsData.find((round) => {
        return round.roundNumber === parseBN(lastRoundNumber);
      });

      // if this scope is reached, lastRoundAcc must exist
      return lastRoundAcc!.outcome;
    } else {
      return null;
    }
  }, [tableData, roundsData, isNotFirstRound]);

  const handleRoundChange = useCallback(
    async (acc: AccountInfo<Buffer<ArrayBufferLike>>) => {
      const round = MAGIC_ROULETTE_CLIENT.program.coder.accounts.decode<Round>(
        "round",
        acc.data
      );

      if (!currentRound) {
        throw new Error("Table not loaded.");
      }

      if (!new BN(currentRound.poolAmount).eq(round.poolAmount)) {
        // pool amount has changed
        await roundsMutate(
          (prev) => {
            // use roundsData as fallback if cache is not populated yet
            const data = roundsData || prev;

            if (!data) {
              throw new Error("Rounds should not be null.");
            }

            return data.map((prevRound) => {
              if (prevRound.roundNumber === parseBN(round.roundNumber)) {
                return {
                  ...prevRound,
                  poolAmount: parseBN(round.poolAmount),
                };
              }

              return prevRound;
            });
          },
          {
            revalidate: false,
            populateCache: true,
          }
        );
      } else if (round.isSpun && round.outcome === null) {
        // round has ended, spinning roulette
        await roundsMutate(
          (prev) => {
            // use roundsData as fallback if cache is not populated yet
            const data = roundsData || prev;

            if (!data) {
              throw new Error("Rounds should not be null.");
            }

            return data.map((prevRound) => {
              if (prevRound.roundNumber === parseBN(round.roundNumber)) {
                return {
                  ...prevRound,
                  isSpun: true,
                };
              }

              return prevRound;
            });
          },
          {
            revalidate: false,
            populateCache: true,
          }
        );
      } else if (round.outcome !== null) {
        // round has ended, advancing to next round
        if (publicKey && currentRound) {
          const roundPlayerBet = betsData?.find((bet) => {
            return bet.round === currentRound.publicKey;
          });

          if (roundPlayerBet) {
            const hasWon = isWinner(roundPlayerBet.betType, round.outcome);

            if (hasWon) {
              const amountWonInLamports = new BN(roundPlayerBet.amount).muln(
                payoutMultiplier(roundPlayerBet.betType)
              );
              const amountWonInSol = parseLamportsToSol(
                amountWonInLamports.toString()
              );

              toast.success(
                <p>
                  You won{" "}
                  <span className="text-yellow-500">{amountWonInSol} SOL</span>{" "}
                  from round #{parseBN(round.roundNumber)}!
                </p>
              );
            }
          }
        }

        const newRoundNumber = round.roundNumber.addn(1);

        await tableMutate(
          (prev) => {
            // use tableData as fallback if cache is not populated yet
            const data = tableData || prev;

            if (!data) {
              throw new Error("Table should not be null.`");
            }

            return {
              ...data,
              currentRoundNumber: parseBN(newRoundNumber),
              nextRoundTs: parseBN(
                new BN(milliToTimestamp(time.getTime())).add(
                  new BN(data.roundPeriodTs)
                )
              ),
            };
          },
          {
            revalidate: false,
            populateCache: true,
          }
        );

        const newRoundPda = MagicRouletteClient.getRoundPda(newRoundNumber);

        await roundsMutate(
          (prev) => {
            // use roundsData as fallback if cache is not populated yet
            const data = roundsData || prev;

            if (!data) {
              throw new Error("Rounds should not be null.");
            }

            const rounds = data.map((prevRound) => {
              if (prevRound.roundNumber === parseBN(round.roundNumber)) {
                return {
                  ...prevRound,
                  outcome: round.outcome,
                };
              }

              return prevRound;
            });

            return [
              ...rounds,
              {
                publicKey: newRoundPda.toBase58(),
                roundNumber: parseBN(newRoundNumber),
                isSpun: false,
                outcome: null,
                poolAmount: "0",
              },
            ];
          },
          {
            revalidate: false,
            populateCache: true,
          }
        );
      }
    },
    [
      publicKey,
      betsData,
      currentRound,
      roundsData,
      tableData,
      time,
      roundsMutate,
      tableMutate,
    ]
  );

  useEffect(() => {
    if (!currentRound) return;

    const id = connection.onAccountChange(
      new PublicKey(currentRound.publicKey),
      (acc) => handleRoundChange(acc)
    );

    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [connection, currentRound, handleRoundChange]);

  return (
    <RoundsContext.Provider
      value={{
        roundsData,
        roundsLoading,
        roundsMutate,
        roundEndsInSecs,
        isRoundOver,
        currentRound,
        lastRoundOutcome,
      }}
    >
      {children}
    </RoundsContext.Provider>
  );
}
