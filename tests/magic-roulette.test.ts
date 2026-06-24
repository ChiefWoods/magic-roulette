import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import {
  betType,
  createClaimWinningsInstruction,
  createInitializeTableInstruction,
  createPlaceBetInstruction,
  createSpinRouletteInstruction,
  createUpdateTableInstruction,
  createWithdrawVaultInstruction,
  fetchBetAccount,
  fetchRoundAccount,
  fetchTableAccount,
  findBetPda,
  findRoundPda,
  findTablePda,
  findVaultPda,
  type BetType,
} from "@magic-roulette/sdk";
import { isWinner } from "@magic-roulette/sdk/bet";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { sleep } from "bun";

import { BASE_TX_FEE } from "./constants";
import { defundAccount, fundAccounts, sendInstructions, skipBetAccIfExists } from "./utils";

describe("magic-roulette", () => {
  const connection = new Connection(process.env.ANCHOR_PROVIDER_URL || clusterApiUrl("devnet"), {
    commitment: "confirmed",
  });
  const wallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.ANCHOR_WALLET!)));

  // simulating with 12 players for 13 possible bet types
  const players = Array.from({ length: 12 }, () => Keypair.generate());

  const [tablePda] = findTablePda();
  const [vaultPda] = findVaultPda();

  const possibleBetTypes: BetType[] = [
    betType("StraightUp", { number: 0 }),
    betType("Split", { numbers: new Uint8Array([1, 2]) }),
    betType("Street", { numbers: new Uint8Array([7, 8, 9]) }),
    betType("Corner", { numbers: new Uint8Array([10, 11, 13, 14]) }),
    betType("Line", { numbers: new Uint8Array([31, 32, 33, 34, 35, 36]) }),
    betType("Column", { column: 1 }),
    betType("Dozen", { dozen: 2 }),
    betType("Red"),
    betType("Black"),
    betType("Even"),
    betType("Odd"),
    betType("High"),
    betType("Low"),
  ];

  beforeAll(async () => {
    // fund each account used in testing
    console.log("Funding wallets...");
    await fundAccounts(
      connection,
      wallet,
      players.map((player) => player.publicKey),
      LAMPORTS_PER_SOL * 0.1,
    );
  });

  // for the purpose of speed testing, set a short round period
  const roundPeriodTs = 45n; // 45 secs

  test("initialize table", async () => {
    // table is a singleton, so this test only succeeds once per program deployed on a cluster
    if ((await connection.getAccountInfo(tablePda)) !== null) {
      console.log("Table already initialized, skipping...");
      return;
    }

    const minimumBetAmount = 500n; // 500 lamports

    await sendInstructions(connection, wallet, [
      createInitializeTableInstruction(
        { admin: wallet.publicKey },
        { minimumBetAmount, roundPeriodTs },
      ),
    ]);

    const tableAcc = (await fetchTableAccount(connection, tablePda)).data;

    expect(tableAcc.admin).toStrictEqual(wallet.publicKey);
    expect(tableAcc.minimumBetAmount).toBe(minimumBetAmount);
    expect(tableAcc.roundPeriodTs).toBe(roundPeriodTs);

    const vaultBal = await connection.getBalance(vaultPda);
    expect(vaultBal).toBeGreaterThan(0);

    // fund vault to cover any potential winnings
    await fundAccounts(connection, wallet, [vaultPda], LAMPORTS_PER_SOL);
  });

  test("update table", async () => {
    const minimumBetAmount = 1000n; // 1000 lamports

    await sendInstructions(connection, wallet, [
      createUpdateTableInstruction(
        { admin: wallet.publicKey },
        { minimumBetAmount, roundPeriodTs: null, newAdmin: null },
      ),
    ]);

    const tableAcc = (await fetchTableAccount(connection, tablePda)).data;

    expect(tableAcc.minimumBetAmount).toBe(minimumBetAmount);
    expect(tableAcc.roundPeriodTs).toBe(roundPeriodTs);
  });

  test("place bet for all players", async () => {
    const tableAcc = (await fetchTableAccount(connection, tablePda)).data;
    const currentRoundNumber = tableAcc.currentRoundNumber;
    const [roundPda] = findRoundPda({ roundNumber: currentRoundNumber });

    const betAmount = 1000n; // 1000 lamports

    for (let i = 0; i < players.length; i++) {
      console.log(`Placing bet for player ${i + 1}...`);
      const player = players[i];
      const selectedBetType = possibleBetTypes[i % possibleBetTypes.length]!;
      const [betPda] = findBetPda({ round: roundPda, player: player.publicKey });

      await skipBetAccIfExists(connection, betPda);

      await sendInstructions(connection, player, [
        createPlaceBetInstruction(
          { player: player.publicKey, round: roundPda },
          { betType: selectedBetType, betAmount },
        ),
      ]);
    }

    const roundAcc = (await fetchRoundAccount(connection, roundPda)).data;

    expect(roundAcc.poolAmount).toBe(BigInt(players.length) * betAmount);
  });

  let currentRoundPda: PublicKey;

  test("spin the roulette", async () => {
    const tableAcc = (await fetchTableAccount(connection, tablePda)).data;
    const currentRoundNumber = tableAcc.currentRoundNumber;

    currentRoundPda = findRoundPda({ roundNumber: currentRoundNumber })[0];
    const newRoundPda = findRoundPda({ roundNumber: currentRoundNumber + 1n })[0];

    const currentTs = Math.floor(Date.now() / 1000);

    // wait until current time surpasses nextRoundTs
    if (currentTs < Number(tableAcc.nextRoundTs) + 1) {
      const waitTimeMs = (Number(tableAcc.nextRoundTs) + 1 - currentTs) * 1000;
      console.log(`Waiting ${waitTimeMs} ms for round period to elapse...`);
      // 3 sec buffer to account for drift
      await sleep(waitTimeMs + 3000);
    }

    await sendInstructions(connection, wallet, [
      createSpinRouletteInstruction({
        payer: wallet.publicKey,
        currentRound: currentRoundPda,
        newRound: newRoundPda,
      }),
    ]);

    const currentRoundAcc = (await fetchRoundAccount(connection, currentRoundPda)).data;

    expect(currentRoundAcc.isSpun).toBe(true);
  });

  test("advance table round", async () => {
    while (true) {
      const currentRoundAcc = (await fetchRoundAccount(connection, currentRoundPda)).data;

      if (currentRoundAcc.outcome !== null) {
        console.log("outcome:", currentRoundAcc.outcome);
        break;
      }

      console.log("Waiting for outcome to be set...");
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  });

  test("claim winnings", async () => {
    let roundAcc = (await fetchRoundAccount(connection, currentRoundPda)).data;

    // wait a bit to ensure all bets are finalized
    await sleep(500);

    await Promise.all(
      players.map(async (player, i) => {
        const [betPda] = findBetPda({ round: currentRoundPda, player: player.publicKey });
        const betAcc = (await fetchBetAccount(connection, betPda)).data;

        if (isWinner(betAcc.betType, roundAcc.outcome)) {
          console.log(`Player ${i + 1} has winning bet, claiming winnings...`);

          const prePlayerBal = await connection.getBalance(player.publicKey);

          await sendInstructions(connection, player, [
            createClaimWinningsInstruction(
              { player: player.publicKey },
              { roundBetAccounts: [currentRoundPda, betPda] },
            ),
          ]);

          const postPlayerBal = await connection.getBalance(player.publicKey);
          expect(prePlayerBal).toBeLessThan(postPlayerBal);
        }
      }),
    );
  });

  test("withdraw from vault", async () => {
    const minRent = await connection.getMinimumBalanceForRentExemption(0);
    const preVaultBal = await connection.getBalance(vaultPda);
    const preAdminBal = await connection.getBalance(wallet.publicKey);
    const withdrawAmount = Math.floor((preVaultBal - minRent) / 2); // withdraw half of vault balance

    await sendInstructions(connection, wallet, [
      createWithdrawVaultInstruction(
        { admin: wallet.publicKey },
        { amount: BigInt(withdrawAmount) },
      ),
    ]);

    const postAdminBal = await connection.getBalance(wallet.publicKey);
    expect(preAdminBal).toBe(postAdminBal - withdrawAmount + BASE_TX_FEE);

    const postVaultBal = await connection.getBalance(vaultPda);
    expect(preVaultBal).toBe(postVaultBal + withdrawAmount);
  });

  afterAll(async () => {
    // defund all accounts used in testing
    console.log("Defunding wallets...");

    for (const kp of players) {
      try {
        const balance = await connection.getBalance(kp.publicKey);
        if (balance > 5000) {
          await defundAccount(connection, kp, wallet.publicKey, balance - 5000);
        }
      } catch (error) {
        console.log(`Failed to defund account: ${error}`);
      }
    }
  });
});
