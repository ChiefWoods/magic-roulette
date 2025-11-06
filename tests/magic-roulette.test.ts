import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { MagicRoulette } from "../target/types/magic_roulette";
import {
  AnchorError,
  AnchorProvider,
  IdlTypes,
  Program,
  setProvider,
  Wallet,
} from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { MagicRouletteClient } from "./client";
import idl from "../target/idl/magic_roulette.json";
import { fundAccount, skipBetAccIfExists } from "./utils";
import { DEFAULT_QUEUE } from "./constants";
import { sleep } from "bun";

describe("magic-roulette", () => {
  const provider = AnchorProvider.env();
  setProvider(provider);
  const program = new Program<MagicRoulette>(idl, provider);
  const magicRouletteClient = new MagicRouletteClient(program);

  const wallet = Wallet.local();
  const [player1, player2] = Array.from({ length: 2 }, () =>
    Keypair.generate()
  );

  const tablePda = magicRouletteClient.getTablePda();
  const vaultPda = magicRouletteClient.getVaultPda();

  beforeAll(async () => {
    // fund each account used in testing
    console.log("Funding wallets...");

    for (const kp of [player1, player2]) {
      await fundAccount(
        provider.connection,
        wallet.payer,
        kp.publicKey,
        LAMPORTS_PER_SOL * 0.1
      );
    }
  });

  // for the purpose of speed testing, set a short round period
  const roundPeriodTs = 5; // 5 secs

  test("initialize table", async () => {
    let tableAcc = await magicRouletteClient.fetchProgramAccount(
      tablePda,
      "table"
    );

    // table is a singleton, so this test only succeeds once per program deployed on a cluster
    if (tableAcc !== null) {
      console.log("Table already initialized, skipping...");
      return;
    }

    const minimumBetAmount = 500; // 500 lamports

    await program.methods
      .initializeTable(new BN(minimumBetAmount), new BN(roundPeriodTs))
      .accounts({
        admin: wallet.publicKey,
      })
      .signers([wallet.payer])
      .rpc();

    tableAcc = await magicRouletteClient.fetchProgramAccount(tablePda, "table");

    expect(tableAcc.admin).toStrictEqual(wallet.payer.publicKey);
    expect(tableAcc.minimumBetAmount.toNumber()).toBe(minimumBetAmount);
    expect(tableAcc.roundPeriodTs.toNumber()).toBe(roundPeriodTs);

    const vaultBal = await provider.connection.getBalance(vaultPda);

    expect(vaultBal).toBeGreaterThan(0);
  });

  test("update table", async () => {
    const minimumBetAmount = 1000; // 1000 lamports

    await program.methods
      .updateTable(new BN(minimumBetAmount), null)
      .accounts({
        admin: wallet.publicKey,
      })
      .signers([wallet.payer])
      .rpc();

    const tableAcc = await magicRouletteClient.fetchProgramAccount(
      tablePda,
      "table"
    );

    expect(tableAcc.minimumBetAmount.toNumber()).toBe(minimumBetAmount);
    expect(tableAcc.roundPeriodTs.toNumber()).toBe(roundPeriodTs);
  });

  test("place bet as player1 and player2", async () => {
    const tableAcc = await magicRouletteClient.fetchProgramAccount(
      tablePda,
      "table"
    );
    const currentRoundNumber = tableAcc.currentRoundNumber;
    console.log("currentRoundNumber:", currentRoundNumber.toNumber());
    const roundPda = magicRouletteClient.getRoundPda(currentRoundNumber);

    const betPda1 = magicRouletteClient.getBetPda(player1.publicKey, roundPda);
    await skipBetAccIfExists(magicRouletteClient, betPda1);

    try {
      const betPda2 = magicRouletteClient.getBetPda(
        player2.publicKey,
        roundPda
      );
      await skipBetAccIfExists(magicRouletteClient, betPda2);

      const betAmount1 = new BN(1000); // 1000 lamports
      const betType1 = { straightUp: {} };

      await program.methods
        .placeBet(betAmount1, betType1)
        .accounts({
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      const betAmount2 = new BN(2000); // 2000 lamports
      const betType2 = { red: {} };

      await program.methods
        .placeBet(betAmount2, betType2)
        .accounts({
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      const roundAcc = await magicRouletteClient.fetchProgramAccount(
        roundPda,
        "round"
      );

      expect(roundAcc.poolAmount.toNumber()).toBe(
        betAmount1.add(betAmount2).toNumber()
      );
    } catch (error) {
      const e = (error as AnchorError).error.errorCode.code;
      console.error(e);
      return;
    }
  });

  let currentRoundPda: PublicKey;

  test("spin the roulette", async () => {
    console.log("Waiting for round period to elapse...");
    await sleep(roundPeriodTs * 1000);
    console.log("Spinning roulette...");

    const tableAcc = await magicRouletteClient.fetchProgramAccount(
      tablePda,
      "table"
    );
    const currentRoundNumber = tableAcc.currentRoundNumber;

    currentRoundPda = magicRouletteClient.getRoundPda(currentRoundNumber);
    const newRoundPda = magicRouletteClient.getRoundPda(
      currentRoundNumber.addn(1)
    );

    console.log("newRoundPda:", newRoundPda.toBase58());

    await program.methods
      .spinRoulette()
      .accounts({
        payer: wallet.publicKey,
        newRound: newRoundPda,
        oracleQueue: DEFAULT_QUEUE,
      })
      .signers([wallet.payer])
      .rpc();

    const currentRoundAcc = await magicRouletteClient.fetchProgramAccount(
      currentRoundPda,
      "round"
    );

    expect(currentRoundAcc.isSpun).toBe(true);
  });

  let winningBetType: IdlTypes<MagicRoulette>["betType"];

  test("advance table round", async () => {
    while (true) {
      const currentRoundAcc = await magicRouletteClient.fetchProgramAccount(
        currentRoundPda,
        "round"
      );

      if (currentRoundAcc.winningBet !== null) {
        console.log("winningBet:", Object.keys(currentRoundAcc.winningBet)[0]);
        winningBetType = currentRoundAcc.winningBet;
        break;
      }

      console.log("Waiting for winning bet to be set...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  });

  test("claim winnings", async () => {
    const betPda1 = magicRouletteClient.getBetPda(
      player1.publicKey,
      currentRoundPda
    );
    const betAcc1 = await magicRouletteClient.fetchProgramAccount(
      betPda1,
      "bet"
    );
    const betPda2 = magicRouletteClient.getBetPda(
      player2.publicKey,
      currentRoundPda
    );
    const betAcc2 = await magicRouletteClient.fetchProgramAccount(
      betPda2,
      "bet"
    );

    let roundAcc = await magicRouletteClient.fetchProgramAccount(
      currentRoundPda,
      "round"
    );

    if (betAcc1.betType === winningBetType) {
      console.log("Player 1 has winning bet, claiming winnings...");

      const prePlayer1Bal = await provider.connection.getBalance(
        player1.publicKey
      );

      await program.methods
        .claimWinnings()
        .accounts({
          player: player1.publicKey,
        })
        .signers([player1])
        .rpc();

      const postPlayer1Bal = await provider.connection.getBalance(
        player1.publicKey
      );

      expect(prePlayer1Bal).toBeLessThan(
        postPlayer1Bal - roundAcc.poolAmount.toNumber()
      );

      roundAcc = await magicRouletteClient.fetchProgramAccount(
        currentRoundPda,
        "round"
      );

      expect(roundAcc.isClaimed).toBe(true);
    } else if (betAcc2.betType === winningBetType) {
      console.log("Player 2 has winning bet, claiming winnings...");

      const prePlayer2Bal = await provider.connection.getBalance(
        player2.publicKey
      );

      await program.methods
        .claimWinnings()
        .accounts({
          player: player2.publicKey,
        })
        .signers([player2])
        .rpc();

      const postPlayer2Bal = await provider.connection.getBalance(
        player1.publicKey
      );

      expect(prePlayer2Bal).toBeLessThan(
        postPlayer2Bal - roundAcc.poolAmount.toNumber()
      );

      roundAcc = await magicRouletteClient.fetchProgramAccount(
        currentRoundPda,
        "round"
      );

      expect(roundAcc.isClaimed).toBe(true);
    } else {
      console.log("No player has winning bet, skipping...");
    }
  });

  afterAll(async () => {
    // defund all accounts used in testing
    console.log("Defunding wallets...");

    for (const kp of [player1, player2]) {
      try {
        const balance = await provider.connection.getBalance(kp.publicKey);
        if (balance > 5000) {
          await fundAccount(
            provider.connection,
            kp,
            wallet.publicKey,
            balance - 5000
          );
        }
      } catch (error) {
        console.log(`Failed to defund account: ${error}`);
      }
    }
  });
});
