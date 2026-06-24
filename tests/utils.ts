import { fetchAllMaybeBetAccounts } from "@magic-roulette/sdk";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";

// fund multiple accounts at once
export async function fundAccounts(
  connection: Connection,
  funder: Keypair,
  to: PublicKey[],
  lamports: number = LAMPORTS_PER_SOL,
) {
  const ixs = to.map((pubkey) =>
    SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: pubkey,
      lamports,
    }),
  );
  const tx = new Transaction().add(...ixs);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = funder.publicKey;
  await sendAndConfirmTransaction(connection, tx, [funder]);
}

export async function defundAccount(
  connection: Connection,
  funder: Keypair,
  to: PublicKey,
  lamports: number,
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

export async function sendInstructions(
  connection: Connection,
  payer: Keypair,
  instructions: TransactionInstruction[],
  extraSigners: Keypair[] = [],
) {
  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = payer.publicKey;
  await sendAndConfirmTransaction(connection, tx, [payer, ...extraSigners], {
    commitment: "confirmed",
  });
}

export async function skipBetAccIfExists(connection: Connection, betPda: PublicKey) {
  const [betAcc] = await fetchAllMaybeBetAccounts(connection, [betPda]);

  if (betAcc !== null) {
    console.log("Bet account already exists, skipping...");
  }
}
