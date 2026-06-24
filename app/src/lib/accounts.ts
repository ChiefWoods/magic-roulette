/**
 * Generated SDK fetcher wrappers that serialize account data into values safe
 * for client-server transmission.
 */
import {
  fetchAllMaybeBetAccounts,
  fetchAllMaybeRoundAccounts,
  fetchProgramAccountsBet,
  fetchProgramAccountsRound,
  fetchTableAccount,
  findTablePda,
  MAGIC_ROULETTE_PROGRAM_ID,
} from "@magic-roulette/sdk";
import { isWinner } from "@magic-roulette/sdk/bet";
import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

import { parseBet, parseRound, parseTable } from "@/types/accounts";
import { parseProgramAccount } from "@/types/parse";

import { DISCRIMINATOR_SIZE } from "./constants";
import { bigIntToBase64, boolToByte } from "./utils";

export async function fetchTable(connection: Connection) {
  const [tablePda] = findTablePda();
  const account = await fetchTableAccount(connection, tablePda);

  return parseProgramAccount(account, parseTable);
}

export async function fetchAllBets(
  connection: Connection,
  queries: {
    player?: string;
    round?: string;
    isClaimed?: boolean;
    isWinning?: boolean;
  } = {},
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

  let bets = (
    await fetchProgramAccountsBet(connection, MAGIC_ROULETTE_PROGRAM_ID, { filters })
  ).map((account) => parseProgramAccount(account, parseBet));

  if (isWinning !== undefined) {
    const rounds = (await fetchProgramAccountsRound(connection, MAGIC_ROULETTE_PROGRAM_ID)).map(
      (account) => parseProgramAccount(account, parseRound),
    );

    bets = bets.filter((bet) => {
      const matchingRound = rounds.find((round) => round.address === bet.data.round);

      if (!matchingRound) {
        throw new Error("Bet has no matching round.");
      }

      const isWinningBet = isWinner(bet.data.betType, matchingRound.data.outcome);

      return isWinning ? isWinningBet : !isWinningBet;
    });
  }

  return bets;
}

export async function fetchMultipleBets(connection: Connection, pdas: string[]) {
  const accounts = await fetchAllMaybeBetAccounts(
    connection,
    pdas.map((pda) => new PublicKey(pda)),
  );

  return accounts.map((account) => (account ? parseProgramAccount(account, parseBet) : null));
}

export async function fetchBet(connection: Connection, pda: string) {
  const [account] = await fetchAllMaybeBetAccounts(connection, [new PublicKey(pda)]);

  return account ? parseProgramAccount(account, parseBet) : null;
}

export async function fetchAllRounds(
  connection: Connection,
  queries: {
    roundNumber?: string;
    isSpun?: boolean;
  } = {},
) {
  const { roundNumber, isSpun } = queries;
  const filters: GetProgramAccountsFilter[] = [];

  if (roundNumber) {
    filters.push({
      memcmp: {
        offset: DISCRIMINATOR_SIZE,
        bytes: bigIntToBase64(BigInt(roundNumber)),
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

  return (await fetchProgramAccountsRound(connection, MAGIC_ROULETTE_PROGRAM_ID, { filters })).map(
    (account) => parseProgramAccount(account, parseRound),
  );
}

export async function fetchMultipleRounds(connection: Connection, pdas: string[]) {
  const accounts = await fetchAllMaybeRoundAccounts(
    connection,
    pdas.map((pda) => new PublicKey(pda)),
  );

  return accounts.map((account) => (account ? parseProgramAccount(account, parseRound) : null));
}

export async function fetchRound(connection: Connection, pda: string) {
  const [account] = await fetchAllMaybeRoundAccounts(connection, [new PublicKey(pda)]);

  return account ? parseProgramAccount(account, parseRound) : null;
}
