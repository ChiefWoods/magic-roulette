import { findVaultPda } from "@magic-roulette/sdk";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

export const admin = Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.ANCHOR_WALLET)));
export const connection = new Connection(
  process.env.ANCHOR_PROVIDER_URL || clusterApiUrl("devnet"),
  { commitment: "confirmed" },
);
export const [vault] = findVaultPda();

export async function sendInstructions(
  connection: Connection,
  payer: Keypair,
  instructions: TransactionInstruction[],
  extraSigners: Keypair[] = [],
) {
  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = payer.publicKey;
  return sendAndConfirmTransaction(connection, tx, [payer, ...extraSigners], {
    commitment: "confirmed",
  });
}
