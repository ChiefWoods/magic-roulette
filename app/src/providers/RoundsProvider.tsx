"use client";

import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { deserializeRoundAccount, findRoundPda } from "@magic-roulette/sdk";
import { isWinner, payoutMultiplier } from "@magic-roulette/sdk/bet";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { createContext, ReactNode, use, useEffect, useMemo } from "react";
import { toast } from "sonner";
import useSWR, { KeyedMutator } from "swr";

import { wrappedFetch } from "@/lib/api";
import { milliToTimestamp, parseLamportsToSol, timestampToMilli } from "@/lib/utils";
import { ParsedRound } from "@/types/accounts";
import { parseBigInt } from "@/types/parse";

import { useBets } from "./BetsProvider";
import { useTable } from "./TableProvider";
import { useTime } from "./TimeProvider";

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
  return use(RoundsContext);
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
    },
  );
  const { tableData, tableMutate } = useTable();
  const { betsData } = useBets();
  const { publicKey } = useUnifiedWallet();
  const { connection } = useConnection();
  const { time } = useTime();

  const roundEndsInSecs = useMemo(() => {
    return tableData
      ? // use time state to update every interval
        timestampToMilli(Number(tableData.data.nextRoundTs)) - time.getTime()
      : Infinity;
  }, [tableData, time]);

  const isRoundOver = roundEndsInSecs <= 0;

  const currentRoundNumber = tableData ? BigInt(tableData.data.currentRoundNumber) : 0n;
  const isNotFirstRound = currentRoundNumber > 1n;

  const currentRound =
    roundsData && tableData
      ? roundsData.find((round) => round.data.roundNumber === tableData.data.currentRoundNumber) ||
        null
      : null;

  const lastRoundOutcome = useMemo(() => {
    if (roundsData && isNotFirstRound && tableData) {
      const lastRoundAcc = roundsData.find((round) => {
        return round.data.roundNumber === (currentRoundNumber - 1n).toString();
      });

      // if this scope is reached, lastRoundAcc must exist
      return lastRoundAcc!.data.outcome;
    }

    return null;
  }, [tableData, roundsData, isNotFirstRound, currentRoundNumber]);

  const currentRoundPubkey = currentRound?.address;
  const currentRoundPoolAmount = currentRound?.data.poolAmount;

  useEffect(() => {
    if (!currentRoundPubkey || !currentRoundPoolAmount) return;

    const handleRoundChange = async (acc: AccountInfo<Buffer<ArrayBufferLike>>) => {
      const round = deserializeRoundAccount(acc.data);

      if (BigInt(currentRoundPoolAmount) !== round.poolAmount) {
        // pool amount has changed
        await roundsMutate(
          (prev) => {
            // use roundsData as fallback if cache is not populated yet
            const data = roundsData || prev;

            if (!data) {
              throw new Error("Rounds should not be null.");
            }

            return data.map((prevRound) => {
              if (prevRound.data.roundNumber === parseBigInt(round.roundNumber)) {
                return {
                  ...prevRound,
                  data: {
                    ...prevRound.data,
                    poolAmount: parseBigInt(round.poolAmount),
                  },
                };
              }

              return prevRound;
            });
          },
          {
            revalidate: false,
            populateCache: true,
          },
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
              if (prevRound.data.roundNumber === parseBigInt(round.roundNumber)) {
                return {
                  ...prevRound,
                  data: {
                    ...prevRound.data,
                    isSpun: true,
                  },
                };
              }

              return prevRound;
            });
          },
          {
            revalidate: false,
            populateCache: true,
          },
        );
      } else if (round.outcome !== null) {
        // round has ended, advancing to next round
        if (publicKey) {
          const roundPlayerBet = betsData?.find((bet) => {
            return bet.data.round === currentRoundPubkey;
          });

          if (roundPlayerBet) {
            const hasWon = isWinner(roundPlayerBet.data.betType, round.outcome);

            if (hasWon) {
              const amountWonInLamports = (
                BigInt(roundPlayerBet.data.amount) *
                BigInt(payoutMultiplier(roundPlayerBet.data.betType))
              ).toString();
              const amountWonInSol = parseLamportsToSol(amountWonInLamports);

              toast.success(
                <p>
                  You won <span className="text-yellow-500">{amountWonInSol} SOL</span> from round #
                  {parseBigInt(round.roundNumber)}!
                </p>,
              );
            }
          }
        }

        const newRoundNumber = round.roundNumber + 1n;
        // time state not used because it's not passed as a dependency to this effect
        const now = Date.now();

        await tableMutate(
          (prev) => {
            // use tableData as fallback if cache is not populated yet
            const data = tableData || prev;

            if (!data) {
              throw new Error("Table should not be null.`");
            }

            return {
              ...data,
              data: {
                ...data.data,
                currentRoundNumber: parseBigInt(newRoundNumber),
                nextRoundTs: parseBigInt(
                  BigInt(milliToTimestamp(now)) + BigInt(data.data.roundPeriodTs),
                ),
              },
            };
          },
          {
            revalidate: false,
            populateCache: true,
          },
        );

        const [newRoundPda] = findRoundPda({ roundNumber: newRoundNumber });

        await roundsMutate(
          (prev) => {
            // use roundsData as fallback if cache is not populated yet
            const data = roundsData || prev;

            if (!data) {
              throw new Error("Rounds should not be null.");
            }

            const rounds = data.map((prevRound) => {
              if (prevRound.data.roundNumber === parseBigInt(round.roundNumber)) {
                return {
                  ...prevRound,
                  data: {
                    ...prevRound.data,
                    outcome: round.outcome,
                  },
                };
              }

              return prevRound;
            });

            return [
              ...rounds,
              {
                address: newRoundPda.toBase58(),
                data: {
                  roundNumber: parseBigInt(newRoundNumber),
                  isSpun: false,
                  outcome: null,
                  poolAmount: "0",
                  bump: 0,
                },
              },
            ];
          },
          {
            revalidate: false,
            populateCache: true,
          },
        );
      }
    };

    const id = connection.onAccountChange(new PublicKey(currentRoundPubkey), handleRoundChange);

    return () => {
      connection.removeAccountChangeListener(id);
    };
  }, [
    betsData,
    connection,
    currentRoundPoolAmount,
    currentRoundPubkey,
    publicKey,
    roundsData,
    roundsMutate,
    tableData,
    tableMutate,
  ]);

  const value = useMemo(
    () => ({
      roundsData,
      roundsLoading,
      roundsMutate,
      roundEndsInSecs,
      isRoundOver,
      currentRound,
      lastRoundOutcome,
    }),
    [
      roundsData,
      roundsLoading,
      roundsMutate,
      roundEndsInSecs,
      isRoundOver,
      currentRound,
      lastRoundOutcome,
    ],
  );

  return <RoundsContext.Provider value={value}>{children}</RoundsContext.Provider>;
}
