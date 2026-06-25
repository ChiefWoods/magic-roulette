"use client";

import { useConnection } from "@jup-ag/wallet-adapter";
import { createSpinRouletteInstruction, findRoundPda } from "@magic-roulette/sdk";
import { formatBetType } from "@magic-roulette/sdk/bet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { sendPermissionedTx } from "@/lib/api";
import { buildTx, FUNDED_KEYPAIR_PUBKEY } from "@/lib/client/solana";
import { cn, formatCountdown, milliToTimestamp } from "@/lib/utils";
import { useBets } from "@/providers/BetsProvider";
import { useRounds } from "@/providers/RoundsProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useTable } from "@/providers/TableProvider";
import { useTransaction } from "@/providers/TransactionProvider";

import { BigRoundedButton } from "./BigRoundedButton";
import { InfoDiv } from "./InfoDiv";
import { Skeleton } from "./ui/skeleton";

function LoadingSkeleton() {
  return <Skeleton className="h-8 w-12" />;
}

function RoundInfoSpan({ text }: { text: string }) {
  return (
    <span className="text-secondary-foreground text-center text-2xl font-semibold">{text}</span>
  );
}

function RoundInfoP({ text }: { text: string }) {
  return <p className="text-secondary-foreground text-sm">{text}</p>;
}

export function RoundInfo() {
  const { priorityFee, getAccountLink } = useSettings();
  const { connection } = useConnection();
  const { tableData } = useTable();
  const { betsData, betsLoading } = useBets();
  const { lastRoundOutcome, currentRound, isRoundOver, roundEndsInSecs } = useRounds();
  const { isSendingTransaction, setIsSendingTransaction, showTransactionToast } = useTransaction();

  if (!tableData) {
    throw new Error("Table is not initialized.");
  }

  const currentBetType = useMemo(() => {
    const betAcc = betsData?.find((bet) => {
      return bet.data.round === currentRound?.address;
    });

    if (!betAcc) return null;

    return betAcc.data.betType;
  }, [currentRound, betsData]);

  const spinRoulette = useCallback(() => {
    toast.promise(
      async () => {
        if (!tableData) {
          throw new Error("Table is not initialized.");
        }

        setIsSendingTransaction(true);

        const currentRoundNumber = BigInt(tableData.data.currentRoundNumber);
        const [currentRoundPda] = findRoundPda({ roundNumber: currentRoundNumber });
        const [newRoundPda] = findRoundPda({ roundNumber: currentRoundNumber + 1n });

        const tx = await buildTx(
          connection,
          [
            createSpinRouletteInstruction({
              payer: FUNDED_KEYPAIR_PUBKEY,
              currentRound: currentRoundPda,
              newRound: newRoundPda,
            }),
          ],
          FUNDED_KEYPAIR_PUBKEY,
          [],
          priorityFee,
        );

        const signature = await sendPermissionedTx(tx);

        return {
          signature,
        };
      },
      {
        loading: "Spinning roulette...",
        success: async ({ signature }) => {
          return showTransactionToast("Roulette spun!", signature);
        },
        error: (err) => {
          console.error(err);
          setIsSendingTransaction(false);
          return err.message || "Something went wrong.";
        },
      },
    );
  }, [tableData, connection, priorityFee, setIsSendingTransaction, showTransactionToast]);

  const currentRoundNumber = BigInt(tableData.data.currentRoundNumber);

  return (
    <section className="flex grow flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <InfoDiv
          className={cn(tableData ? "cursor-pointer" : "")}
          onClick={
            tableData
              ? () => {
                  window.open(getAccountLink(tableData.address), "_blank");
                }
              : undefined
          }
        >
          {tableData && <RoundInfoSpan text={`#${tableData.data.currentRoundNumber}`} />}
          <RoundInfoP text="Current Round" />
        </InfoDiv>
        <InfoDiv
          className={cn(currentRound ? "cursor-pointer" : "")}
          onClick={
            currentRound
              ? () => {
                  window.open(getAccountLink(currentRound.address), "_blank");
                }
              : undefined
          }
        >
          {currentRound && (
            <RoundInfoSpan text={`${parseInt(currentRound.data.poolAmount) / LAMPORTS_PER_SOL}`} />
          )}
          <RoundInfoP text="Pool Amount (SOL)" />
        </InfoDiv>
        <InfoDiv
          className={cn(tableData && currentRoundNumber > 1n ? "cursor-pointer" : "")}
          onClick={
            tableData && currentRoundNumber > 1n
              ? () => {
                  const [previousRoundPda] = findRoundPda({ roundNumber: currentRoundNumber - 1n });
                  window.open(getAccountLink(previousRoundPda.toString()), "_blank");
                }
              : undefined
          }
        >
          {!tableData ? (
            <LoadingSkeleton />
          ) : (
            <RoundInfoSpan text={lastRoundOutcome !== null ? lastRoundOutcome.toString() : "-"} />
          )}
          <RoundInfoP text="Last Round Outcome" />
        </InfoDiv>
        <InfoDiv
          className={cn(currentBetType ? "cursor-pointer" : "")}
          onClick={
            currentBetType && betsData && currentRound
              ? () => {
                  const bet = betsData.find((bet) => {
                    return bet.data.round === currentRound.address;
                  });

                  if (!bet) {
                    throw new Error("Bet not found.");
                  }

                  window.open(getAccountLink(bet.address), "_blank");
                }
              : undefined
          }
        >
          {betsLoading ? (
            <LoadingSkeleton />
          ) : (
            <RoundInfoSpan text={currentBetType !== null ? formatBetType(currentBetType) : "-"} />
          )}
          <RoundInfoP text="Your Bet" />
        </InfoDiv>
      </div>
      <BigRoundedButton
        onClick={spinRoulette}
        disabled={!tableData || currentRound?.data.isSpun || !isRoundOver || isSendingTransaction}
      >
        {!tableData
          ? "Spin Roulette"
          : currentRound?.data.isSpun
            ? "Awaiting outcome..."
            : !isRoundOver
              ? `Round ends in ${formatCountdown(milliToTimestamp(roundEndsInSecs))}`
              : "Spin Roulette"}
      </BigRoundedButton>
    </section>
  );
}
