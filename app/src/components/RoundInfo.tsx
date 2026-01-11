"use client";

import { useTable } from "@/providers/TableProvider";
import { Skeleton } from "./ui/skeleton";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import {
  cn,
  formatBetType,
  formatCountdown,
  milliToTimestamp,
} from "@/lib/utils";
import { useProgram } from "@/providers/ProgramProvider";
import { useConnection } from "@jup-ag/wallet-adapter";
import { BN } from "@coral-xyz/anchor";
import { buildTx, FUNDED_KEYPAIR_PUBKEY } from "@/lib/client/solana";
import { useSettings } from "@/providers/SettingsProvider";
import { sendPermissionedTx } from "@/lib/api";
import { toast } from "sonner";
import { useTransaction } from "@/providers/TransactionProvider";
import { BigRoundedButton } from "./BigRoundedButton";
import { InfoDiv } from "./InfoDiv";
import { useBets } from "@/providers/BetsProvider";
import { useRounds } from "@/providers/RoundsProvider";
import { MagicRouletteClient } from "@/classes/MagicRouletteClient";

function LoadingSkeleton() {
  return <Skeleton className="w-12 h-8" />;
}

function RoundInfoSpan({ text }: { text: string }) {
  return (
    <span className="text-2xl font-semibold text-secondary-foreground text-center">
      {text}
    </span>
  );
}

function RoundInfoP({ text }: { text: string }) {
  return <p className="text-sm text-secondary-foreground">{text}</p>;
}

export function RoundInfo() {
  const { magicRouletteClient } = useProgram();
  const { priorityFee, getAccountLink } = useSettings();
  const { connection } = useConnection();
  const { tableData, tableLoading } = useTable();
  const { betsData, betsLoading } = useBets();
  const {
    lastRoundOutcome,
    currentRound,
    isRoundOver,
    roundEndsInSecs,
    roundsLoading,
    roundsMutate,
  } = useRounds();
  const {
    isSendingTransaction,
    setIsSendingTransaction,
    showTransactionToast,
  } = useTransaction();

  if (!tableLoading && !tableData) {
    throw new Error("Table is not initialized.");
  }

  const currentBetType = useMemo(() => {
    const betAcc = betsData?.find((bet) => {
      return bet.round === currentRound?.publicKey;
    });

    if (!betAcc) return null;

    return betAcc.betType;
  }, [currentRound, betsData]);

  const spinRoulette = useCallback(() => {
    toast.promise(
      async () => {
        if (!tableData) {
          throw new Error("Table is not initialized.");
        }

        setIsSendingTransaction(true);

        const currentRoundPda = MagicRouletteClient.getRoundPda(
          new BN(tableData.currentRoundNumber)
        );
        const newRoundPda = MagicRouletteClient.getRoundPda(
          new BN(tableData.currentRoundNumber).addn(1)
        );

        const tx = await buildTx(
          connection,
          [
            await magicRouletteClient.spinRouletteIx({
              payer: FUNDED_KEYPAIR_PUBKEY,
              currentRound: currentRoundPda,
              newRound: newRoundPda,
            }),
          ],
          FUNDED_KEYPAIR_PUBKEY,
          [],
          priorityFee
        );

        const signature = await sendPermissionedTx(tx);

        return {
          signature,
        };
      },
      {
        loading: "Spinning roulette...",
        success: async ({ signature }) => {
          await roundsMutate((prev) => {
            if (!prev) {
              throw new Error("Rounds should not be null.");
            }

            if (!currentRound) {
              throw new Error("Round should not be null.");
            }

            return prev.map((round) => {
              if (round.publicKey === currentRound.publicKey) {
                return {
                  ...round,
                  isSpun: true,
                };
              }
              return round;
            });
          });

          return showTransactionToast("Roulette spun!", signature);
        },
        error: (err) => {
          console.error(err);
          setIsSendingTransaction(false);
          return err.message || "Something went wrong.";
        },
      }
    );
  }, [
    tableData,
    currentRound,
    connection,
    magicRouletteClient,
    priorityFee,
    setIsSendingTransaction,
    showTransactionToast,
    roundsMutate,
  ]);

  return (
    <section className="flex flex-col gap-4 grow">
      <div className="grid grid-cols-2 gap-2">
        <InfoDiv
          className={cn(tableData ? "cursor-pointer" : "")}
          onClick={() => {
            if (tableData) {
              window.open(
                getAccountLink(tableData.publicKey.toString()),
                "_blank"
              );
            }
          }}
        >
          {tableLoading ? (
            <LoadingSkeleton />
          ) : (
            tableData && (
              <RoundInfoSpan text={`#${tableData.currentRoundNumber}`} />
            )
          )}
          <RoundInfoP text="Current Round" />
        </InfoDiv>
        <InfoDiv
          className={cn(currentRound ? "cursor-pointer" : "")}
          onClick={() => {
            if (currentRound) {
              window.open(
                getAccountLink(currentRound.publicKey.toString()),
                "_blank"
              );
            }
          }}
        >
          {roundsLoading ? (
            <LoadingSkeleton />
          ) : (
            currentRound && (
              <RoundInfoSpan
                text={`${parseInt(currentRound.poolAmount) / LAMPORTS_PER_SOL}`}
              />
            )
          )}
          <RoundInfoP text="Pool Amount (SOL)" />
        </InfoDiv>
        <InfoDiv
          className={cn(
            tableData && new BN(tableData.currentRoundNumber).gtn(1)
              ? "cursor-pointer"
              : ""
          )}
          onClick={() => {
            if (tableData && new BN(tableData.currentRoundNumber).gtn(1)) {
              const previousRoundData = MagicRouletteClient.getRoundPda(
                new BN(tableData.currentRoundNumber).subn(1)
              );
              window.open(
                getAccountLink(previousRoundData.toString()),
                "_blank"
              );
            }
          }}
        >
          {!tableData ? (
            <LoadingSkeleton />
          ) : (
            <RoundInfoSpan
              text={
                lastRoundOutcome !== null ? lastRoundOutcome.toString() : "-"
              }
            />
          )}
          <RoundInfoP text="Last Round Outcome" />
        </InfoDiv>
        <InfoDiv
          className={cn(currentBetType ? "cursor-pointer" : "")}
          onClick={() => {
            if (currentBetType && betsData && currentRound) {
              const bet = betsData.find((bet) => {
                return bet.round === currentRound.publicKey;
              });

              if (!bet) {
                throw new Error("Bet not found.");
              }

              window.open(getAccountLink(bet.publicKey), "_blank");
            }
          }}
        >
          {roundsLoading || betsLoading ? (
            <LoadingSkeleton />
          ) : (
            <RoundInfoSpan
              text={
                currentBetType !== null ? formatBetType(currentBetType) : "-"
              }
            />
          )}
          <RoundInfoP text="Your Bet" />
        </InfoDiv>
      </div>
      <BigRoundedButton
        onClick={spinRoulette}
        disabled={
          !tableData ||
          currentRound?.isSpun ||
          !isRoundOver ||
          isSendingTransaction
        }
      >
        {!tableData
          ? "Spin Roulette"
          : currentRound?.isSpun
          ? "Awaiting outcome..."
          : !isRoundOver
          ? `Round ends in ${formatCountdown(
              milliToTimestamp(roundEndsInSecs)
            )}`
          : "Spin Roulette"}
      </BigRoundedButton>
    </section>
  );
}
