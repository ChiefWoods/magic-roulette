import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { createClaimWinningsInstruction } from "@magic-roulette/sdk";
import { PublicKey } from "@solana/web3.js";
import { useCallback } from "react";
import { toast } from "sonner";
import { KeyedMutator } from "swr";

import { sendTx } from "@/lib/api";
import { buildTx } from "@/lib/client/solana";
import { ParsedBet, ParsedRound } from "@/types/accounts";
import { CuPriceRange } from "@/types/transactions";

export function useClaimWinnings({
  roundsData,
  betsData,
  claimableBets,
  priorityFee,
  betsMutate,
  setIsSendingTransaction,
  showTransactionToast,
}: {
  roundsData: ParsedRound[] | undefined;
  betsData: ParsedBet[] | undefined;
  claimableBets: ParsedBet[];
  priorityFee: CuPriceRange;
  betsMutate: KeyedMutator<ParsedBet[]>;
  setIsSendingTransaction: (isSending: boolean) => void;
  showTransactionToast: (title: string, signature: string) => React.JSX.Element;
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useUnifiedWallet();

  return useCallback(() => {
    toast.promise(
      async () => {
        if (!publicKey || !signTransaction) {
          throw new Error("Wallet not connected.");
        }

        if (!roundsData || roundsData.length === 0) {
          throw new Error("No rounds have been played.");
        }

        if (!betsData || betsData.length === 0 || claimableBets.length === 0) {
          throw new Error("No bets to claim.");
        }

        const roundAndBets = claimableBets.map((bet) => ({
          round: bet.data.round,
          bet: bet.address,
        }));

        setIsSendingTransaction(true);

        let tx = await buildTx(
          connection,
          [
            createClaimWinningsInstruction(
              { player: publicKey },
              {
                roundBetAccounts: claimableBets.flatMap((bet) => [
                  new PublicKey(bet.data.round),
                  new PublicKey(bet.address),
                ]),
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
          roundAndBets,
        };
      },
      {
        loading: "Waiting for signature...",
        success: async ({ signature, roundAndBets }) => {
          await betsMutate(
            (prev) => {
              if (!prev) {
                throw new Error("Bets should not be null.");
              }

              return prev.map((bet) => {
                const claimedBet = roundAndBets.some(
                  ({ bet: betPubkey }) => betPubkey === bet.address,
                );

                if (claimedBet) {
                  return {
                    ...bet,
                    data: { ...bet.data, isClaimed: true },
                  };
                }

                return bet;
              });
            },
            {
              revalidate: false,
            },
          );

          return showTransactionToast("Winnings claimed!", signature);
        },
        error: (err) => {
          console.error(err);
          setIsSendingTransaction(false);
          return err.message || "Something went wrong.";
        },
      },
    );
  }, [
    betsData,
    connection,
    publicKey,
    roundsData,
    priorityFee,
    claimableBets,
    signTransaction,
    setIsSendingTransaction,
    showTransactionToast,
    betsMutate,
  ]);
}
