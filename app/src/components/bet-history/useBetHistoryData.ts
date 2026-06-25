import { formatBetType, isWinner, payoutMultiplier } from "@magic-roulette/sdk/bet";
import { useMemo } from "react";

import { parseLamportsToSol } from "@/lib/utils";
import { ParsedBet, ParsedRound } from "@/types/accounts";
import { parseBigInt } from "@/types/parse";

import { BetHistoryRecord, FilterValue } from "./types";

export function useBetHistoryData(
  roundsData: ParsedRound[] | undefined,
  betsData: ParsedBet[] | undefined,
  filter: FilterValue,
) {
  const claimableBets = useMemo(() => {
    if (!betsData || !roundsData) return [];

    return betsData.filter((bet) => {
      const matchingRound = roundsData.find((round) => round.address === bet.data.round);

      if (!matchingRound) {
        return false;
      }

      return isWinner(bet.data.betType, matchingRound.data.outcome) && !bet.data.isClaimed;
    });
  }, [betsData, roundsData]);

  const claimableAmount = useMemo(() => {
    return claimableBets.reduce((amount, bet) => amount + BigInt(bet.data.amount), 0n);
  }, [claimableBets]);

  const netPnL = useMemo(() => {
    if (!betsData || !roundsData) return 0n;

    return betsData.reduce((total, bet) => {
      const matchingRound = roundsData.find((round) => round.address === bet.data.round);

      if (!matchingRound) {
        return total;
      }

      if (matchingRound.data.outcome === null) {
        return total;
      }

      if (isWinner(bet.data.betType, matchingRound.data.outcome)) {
        const payout = BigInt(bet.data.amount) * BigInt(payoutMultiplier(bet.data.betType));
        return total + payout;
      }

      return total - BigInt(bet.data.amount);
    }, 0n);
  }, [roundsData, betsData]);

  const data = useMemo<BetHistoryRecord[]>(() => {
    if (!roundsData || !betsData) return [];

    return betsData.reduce<BetHistoryRecord[]>((records, bet) => {
      const matchingRound = roundsData.find((round) => round.address === bet.data.round);

      if (!matchingRound || matchingRound.data.outcome === null) {
        return records;
      }

      const hasWon = isWinner(bet.data.betType, matchingRound.data.outcome);
      const record = {
        publicKey: bet.address,
        round: matchingRound.data.roundNumber,
        amount: parseLamportsToSol(bet.data.amount),
        betType: formatBetType(bet.data.betType),
        outcome: matchingRound.data.outcome,
        hasWon,
        claimable: hasWon && !bet.data.isClaimed,
        payout: hasWon
          ? parseBigInt(BigInt(bet.data.amount) * BigInt(payoutMultiplier(bet.data.betType)))
          : "",
      };

      switch (filter) {
        case FilterValue.Claimable:
          if (record.claimable) records.push(record);
          break;
        case FilterValue.Won:
          if (record.hasWon) records.push(record);
          break;
        case FilterValue.Lost:
          if (!record.hasWon) records.push(record);
          break;
        default:
          records.push(record);
      }

      return records;
    }, []);
  }, [roundsData, betsData, filter]);

  return { claimableBets, claimableAmount, netPnL, data };
}
