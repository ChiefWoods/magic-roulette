import { BN, IdlAccounts, IdlTypes } from '@coral-xyz/anchor';
import { MagicRoulette } from './magic-roulette';
import { PublicKey, SystemProgram } from '@solana/web3.js';

// Denotes a bigint serialized as a string, JavaScript cannot natively represent 2^64-1
export type bigIntString = string;
type pubkey = string;
type u8 = number;
type u16 = number;
type u32 = number;
type u64 = bigIntString;
type i32 = number;
type i64 = bigIntString;
type Option<T> = T | null; 

type ExtractDefinedKeys<T> = T extends any
  ? keyof {
      [K in keyof T as T[K] extends Record<string, never> ? K : never]: T[K];
    }
  : never;

type Table = IdlAccounts<MagicRoulette>['table'];
type Round = IdlAccounts<MagicRoulette>['round'];
type Bet = IdlAccounts<MagicRoulette>['bet'];
export type BetType = IdlTypes<MagicRoulette>['betType'];

export type ParsedBetType = ExtractDefinedKeys<BetType>;

export interface ParsedProgramAccount {
  publicKey: string;
}

export interface ParsedTable extends ParsedProgramAccount {
  admin: pubkey;
  minimumBetAmount: u64;
  currentRoundNumber: u64;
  nextRoundTs: i64;
  roundPeriodTs: u64;
}

export interface ParsedRound extends ParsedProgramAccount {
  roundNumber: u64;
  poolAmount: u64;
  isSpun: boolean;
  isClaimed: boolean;
  winningBet: Option<ParsedBetType>;
}

export interface ParsedBet extends ParsedProgramAccount {
  player: pubkey;
  round: pubkey;
  amount: u64;
  betType: ParsedBetType;
}

export function parseEnum<T>(field: object): T {
  return Object.keys(field)[0] as T;
}

export function unparseEnum<T>(field: string): T {
  return { [field]: {} } as T;
}

function parsePublicKey(field: PublicKey | null): string {
  return !field || field.equals(SystemProgram.programId)
    ? ''
    : field.toBase58();
}

function parseBN(field: BN): bigIntString {
  return field.toString();
}

function parseOption<T>(field: any, parser: (field: any) => T): T | null {
  return field === null ? null : parser(field);
}

export function parseTable({
  admin,
  currentRoundNumber,
  minimumBetAmount,
  nextRoundTs,
  roundPeriodTs,
}: Table): Omit<ParsedTable, 'publicKey'> {
  return {
    admin: parsePublicKey(admin),
    currentRoundNumber: parseBN(currentRoundNumber),
    minimumBetAmount: parseBN(minimumBetAmount),
    nextRoundTs: parseBN(nextRoundTs),
    roundPeriodTs: parseBN(roundPeriodTs),
  };
}

export function parseRound({
  isClaimed,
  isSpun,
  poolAmount,
  roundNumber,
  winningBet,
}: Round): Omit<ParsedRound, 'publicKey'> {
  return {
    isClaimed,
    isSpun,
    poolAmount: parseBN(poolAmount),
    roundNumber: parseBN(roundNumber),
    winningBet: parseOption(winningBet, parseEnum<ParsedBetType>),
  };
}

export function parseBet({
  amount,
  betType,
  player,
  round,
}: Bet): Omit<ParsedBet, 'publicKey'> {
  return {
    amount: parseBN(amount),
    betType: parseEnum<ParsedBetType>(betType),
    player: parsePublicKey(player),
    round: parsePublicKey(round),
  };
}
