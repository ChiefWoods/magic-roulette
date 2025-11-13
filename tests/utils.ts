import { Address } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { MagicRouletteClient } from "./client";

// fund multiple accounts at once
export async function fundAccounts(
  connection: Connection,
  funder: Keypair,
  to: PublicKey[],
  lamports: number = LAMPORTS_PER_SOL
) {
  const ixs = to.map((pubkey) => {
    return SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: pubkey,
      lamports,
    });
  });
  const tx = new Transaction().add(...ixs);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = funder.publicKey;
  await sendAndConfirmTransaction(connection, tx, [funder]);
}

export async function defundAccount(
  connection: Connection,
  funder: Keypair,
  to: PublicKey,
  lamports: number
) {
  const balance = await connection.getBalance(funder.publicKey);

  if (balance > 5000) {
    const ix = SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: to,
      lamports,
    });
    const tx = new Transaction().add(ix);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = funder.publicKey;
    await sendAndConfirmTransaction(connection, tx, [funder]);
  }
}

export async function skipBetAccIfExists(
  client: MagicRouletteClient,
  betPda: Address
) {
  const betAcc = await client.fetchProgramAccount(betPda, "bet");

  if (betAcc !== null) {
    console.log("Bet account already exists, skipping...");
  }
}
