"use client";

import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { createPlaceBetInstruction, findBetPda } from "@magic-roulette/sdk";
import { toSdkBetType } from "@magic-roulette/sdk/bet";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { WalletMinimal } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { sendTx } from "@/lib/api";
import { buildTx } from "@/lib/client/solana";
import { cn, parseLamportsToSol, parseSolToLamports } from "@/lib/utils";
import { useBalance } from "@/providers/BalanceProvider";
import { useBets } from "@/providers/BetsProvider";
import { useRounds } from "@/providers/RoundsProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useTable } from "@/providers/TableProvider";
import { useTransaction } from "@/providers/TransactionProvider";

import { BigRoundedButton } from "./BigRoundedButton";
import { InfoDiv } from "./InfoDiv";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

const increments = [1, 0.1, 0.01];

export function PlaceBetSection() {
  const { balance } = useBalance();
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { priorityFee } = useSettings();
  const { tableData } = useTable();
  const { currentRound, isRoundOver } = useRounds();
  const { betsData, betsMutate, selectedBet, formattedBet } = useBets();
  const { isSendingTransaction, setIsSendingTransaction, showTransactionToast } = useTransaction();
  const [betAmount, setBetAmount] = useState<number>(NaN);

  const isInsufficientBalance = balance === null || balance < betAmount * LAMPORTS_PER_SOL;
  const isBelowMinimumBet =
    isNaN(betAmount) ||
    betAmount <= 0 ||
    Number(tableData?.data.minimumBetAmount) > betAmount * LAMPORTS_PER_SOL;
  const placedBet = Boolean(
    betsData?.find((bet) => {
      return bet.data.round === currentRound?.address && bet.data.player === publicKey?.toBase58();
    }),
  );

  const placeBet = useCallback(
    (betAmount: string) => {
      toast.promise(
        async () => {
          if (!publicKey || !signTransaction) {
            throw new Error("Wallet not connected.");
          }

          if (!selectedBet) {
            throw new Error("No bet selected.");
          }

          if (!currentRound) {
            throw new Error("Round data should not be null.");
          }

          setIsSendingTransaction(true);

          const round = new PublicKey(currentRound.address);
          const amountInLamports = parseSolToLamports(betAmount);

          let tx = await buildTx(
            connection,
            [
              createPlaceBetInstruction(
                { player: publicKey, round },
                {
                  betType: toSdkBetType(selectedBet),
                  betAmount: BigInt(amountInLamports),
                },
              ),
            ],
            publicKey,
            [],
            priorityFee,
          );

          tx = await signTransaction(tx);
          const signature = await sendTx(tx);

          return {
            signature,
            publicKey,
            selectedBet,
            round,
          };
        },
        {
          loading: "Waiting for signature...",
          success: async ({ signature, publicKey, selectedBet, round }) => {
            const amountInLamports = parseSolToLamports(betAmount);
            const [betPda] = findBetPda({ round, player: publicKey });

            await betsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error("Bets should not be null.");
                }

                return [
                  ...prev,
                  {
                    address: betPda.toBase58(),
                    data: {
                      amount: amountInLamports,
                      betType: selectedBet,
                      isClaimed: false,
                      player: publicKey.toBase58(),
                      round: round.toBase58(),
                      bump: 0,
                    },
                  },
                ];
              },
              {
                revalidate: false,
              },
            );

            return showTransactionToast("Bet placed!", signature);
          },
          error: (err) => {
            console.error(err);
            setIsSendingTransaction(false);
            return err.message || "Something went wrong.";
          },
        },
      );
    },
    [
      connection,
      priorityFee,
      publicKey,
      selectedBet,
      currentRound,
      signTransaction,
      setIsSendingTransaction,
      showTransactionToast,
      betsMutate,
    ],
  );

  return (
    <section className="flex flex-col gap-2">
      <InfoDiv className="bg-primary/10">
        <div
          className={cn(
            "flex items-center gap-4 w-full",
            publicKey ? "justify-between" : "justify-end",
          )}
        >
          {balance ? (
            <Button
              asChild
              className={cn(
                "px-1! group bg-transparent hover:bg-transparent focus:bg-transparent hover:text-primary cursor-pointer group-hover:text-primary rounded-xs active:bg-transparent py-[0.5px] h-fit text-sm font-semibold transition-colors",
                isInsufficientBalance ? "text-destructive hover:text-destructive" : "text-accent",
              )}
              onClick={() => setBetAmount(balance / LAMPORTS_PER_SOL)}
            >
              <div>
                <WalletMinimal size={16} />
                <p>{balance / LAMPORTS_PER_SOL} SOL</p>
              </div>
            </Button>
          ) : (
            publicKey && <Skeleton className="h-5 w-full max-w-40" />
          )}
          <div className="flex items-center gap-2 px-1">
            {increments.map((inc) => (
              <Button
                key={inc}
                variant="secondary"
                className="h-6 w-12 cursor-pointer rounded-xs px-4 py-2 text-xs font-semibold"
                onClick={() =>
                  setBetAmount((prev) => {
                    return Number((isNaN(prev) ? 0 + inc : prev + inc).toFixed(9));
                  })
                }
              >
                +{inc}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex w-full items-center gap-4">
          <div className="flex items-center gap-2 px-1">
            <Image alt="Solana" src={"/solana.svg"} width={0} height={0} className="size-5" />
            <span className="text-primary font-semibold">SOL</span>
          </div>
          <Input
            placeholder="1"
            type="number"
            inputMode="decimal"
            step={
              tableData ? Number(parseLamportsToSol(tableData.data.minimumBetAmount)) : 0.000001
            }
            min={tableData ? Number(parseLamportsToSol(tableData.data.minimumBetAmount)) : 0}
            className="no-slider placeholder:text-secondary/75 selection:bg-primary/20 selection:text-primary text-primary border-none bg-transparent! px-1 text-end text-2xl! font-semibold shadow-none outline-none placeholder:text-2xl placeholder:font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
            value={isNaN(betAmount) ? "" : betAmount}
            onChange={(e) => {
              setBetAmount(parseFloat(e.target.value));
            }}
          />
        </div>
      </InfoDiv>
      <div className="flex justify-between">
        <p className="text-secondary font-semibold">Selected Bet</p>
        <p
          className={cn("font-semibold", formattedBet === "" ? "text-primary" : "text-yellow-500")}
        >
          {formattedBet === "" ? "-" : formattedBet}
        </p>
      </div>
      <BigRoundedButton
        className="mt-auto"
        onClick={() => placeBet(betAmount.toString())}
        disabled={
          !tableData ||
          isRoundOver ||
          placedBet ||
          selectedBet === null ||
          isBelowMinimumBet ||
          isInsufficientBalance ||
          isSendingTransaction
        }
      >
        {!tableData
          ? "Place Bet"
          : isRoundOver
            ? "Round Over"
            : placedBet
              ? "Bet Already Placed"
              : selectedBet === null
                ? "Bet Not Selected"
                : isBelowMinimumBet
                  ? tableData
                    ? `Minimum Bet: ${parseLamportsToSol(tableData.data.minimumBetAmount)} SOL`
                    : "Amount Too Low"
                  : isInsufficientBalance
                    ? "Insufficient Balance"
                    : "Place Bet"}
      </BigRoundedButton>
    </section>
  );
}
