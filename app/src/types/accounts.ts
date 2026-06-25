import type { BetAccountData, RoundAccountData, TableAccountData } from "@magic-roulette/sdk";
import { parseBetType, type ParsedBetType } from "@magic-roulette/sdk/bet";

import { parseBigInt, parseOption, ParsedProgramAccount, parsePublicKey } from "./parse";

// Denotes a bigint serialized as a string, JavaScript cannot natively represent 2^64-1

export interface ParsedTable extends ParsedProgramAccount {
  data: Omit<
    TableAccountData,
    "admin" | "minimumBetAmount" | "currentRoundNumber" | "nextRoundTs" | "roundPeriodTs"
  > & {
    admin: string;
    minimumBetAmount: string;
    currentRoundNumber: string;
    nextRoundTs: string;
    roundPeriodTs: string;
  };
}

export interface ParsedRound extends ParsedProgramAccount {
  data: Omit<RoundAccountData, "roundNumber" | "poolAmount" | "outcome"> & {
    roundNumber: string;
    poolAmount: string;
    outcome: number | null;
  };
}

export interface ParsedBet extends ParsedProgramAccount {
  data: Omit<BetAccountData, "player" | "round" | "amount" | "betType"> & {
    player: string;
    round: string;
    amount: string;
    betType: ParsedBetType;
  };
}

export function parseTable({
  admin,
  currentRoundNumber,
  minimumBetAmount,
  nextRoundTs,
  roundPeriodTs,
  bump,
  vaultBump,
}: TableAccountData): ParsedTable["data"] {
  return {
    admin: parsePublicKey(admin),
    currentRoundNumber: parseBigInt(currentRoundNumber),
    minimumBetAmount: parseBigInt(minimumBetAmount),
    nextRoundTs: parseBigInt(nextRoundTs),
    roundPeriodTs: parseBigInt(roundPeriodTs),
    bump,
    vaultBump,
  };
}

export function parseRound({
  isSpun,
  poolAmount,
  roundNumber,
  outcome,
  bump,
}: RoundAccountData): ParsedRound["data"] {
  return {
    isSpun,
    poolAmount: parseBigInt(poolAmount),
    roundNumber: parseBigInt(roundNumber),
    outcome: parseOption(outcome),
    bump,
  };
}

export function parseBet({
  amount,
  betType,
  player,
  round,
  isClaimed,
  bump,
}: BetAccountData): ParsedBet["data"] {
  return {
    amount: parseBigInt(amount),
    betType: parseBetType(betType),
    player: parsePublicKey(player),
    round: parsePublicKey(round),
    isClaimed,
    bump,
  };
}
