import { MagicRouletteClient } from "@/classes/MagicRouletteClient";
import {
  parseTable,
  parseBet,
  parseRound,
  bigIntString,
} from "@/types/accounts";
import { GetProgramAccountsFilter } from "@solana/web3.js";
import { DISCRIMINATOR_SIZE } from "./constants";
import { BNtoBase64, boolToByte } from "./utils";
import { isWinner } from "./betType";
import { BN } from "@coral-xyz/anchor";

// Table
export async function fetchTable(client: MagicRouletteClient) {
  return client.fetchProgramAccount(
    MagicRouletteClient.tablePda.toBase58(),
    "table",
    parseTable
  );
}

// Bets
export async function fetchAllBets(
  client: MagicRouletteClient,
  queries: {
    player?: string;
    round?: string;
    isClaimed?: boolean;
    isWinning?: boolean;
  } = {}
) {
  const { player, round, isClaimed, isWinning } = queries;
  const filters: GetProgramAccountsFilter[] = [];

  if (player) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE,
        bytes: player,
        encoding: "base58",
      },
    });
  }

  if (round) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE + 32,
        bytes: round,
        encoding: "base58",
      },
    });
  }

  if (isClaimed !== undefined) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE + 32 + 32 + 8 + 1,
        bytes: boolToByte(isClaimed),
        encoding: "base64",
      },
    });
  }

  let bets = await client.fetchAllProgramAccounts("bet", parseBet, filters);

  if (isWinning !== undefined) {
    const rounds = await client.fetchAllProgramAccounts("round", parseRound);

    bets = bets.filter((bet) => {
      const matchingRound = rounds.find(
        (round) => round.publicKey === bet.round
      );

      if (!matchingRound) {
        throw new Error("Bet has no matching round.");
      }

      const isWinningBet = isWinner(bet.betType, matchingRound.outcome);

      return isWinning ? isWinningBet : !isWinningBet;
    });
  }

  return bets;
}

export async function fetchMultipleBets(
  client: MagicRouletteClient,
  pdas: string[]
) {
  return client.fetchMultipleProgramAccounts(pdas, "bet", parseBet);
}

export async function fetchBet(client: MagicRouletteClient, pda: string) {
  return client.fetchProgramAccount(pda, "bet", parseBet);
}

// Rounds
export async function fetchAllRounds(
  client: MagicRouletteClient,
  queries: {
    roundNumber?: bigIntString;
    isSpun?: boolean;
  } = {}
) {
  const { roundNumber, isSpun } = queries;
  const filters: GetProgramAccountsFilter[] = [];

  if (roundNumber) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE,
        bytes: BNtoBase64(new BN(roundNumber)),
        encoding: "base64",
      },
    });
  }

  if (isSpun !== undefined) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE + 8 + 8,
        bytes: boolToByte(isSpun),
        encoding: "base64",
      },
    });
  }

  return client.fetchAllProgramAccounts("round", parseRound, filters);
}

export async function fetchMultipleRounds(
  client: MagicRouletteClient,
  pdas: string[]
) {
  return client.fetchMultipleProgramAccounts(pdas, "round", parseRound);
}

export async function fetchRound(client: MagicRouletteClient, pda: string) {
  return client.fetchProgramAccount(pda, "round", parseRound);
}
