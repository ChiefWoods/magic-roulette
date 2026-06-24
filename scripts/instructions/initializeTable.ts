import { createInitializeTableInstruction } from "@magic-roulette/sdk";
import {
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { admin, connection, vault, sendInstructions } from "../setup";

console.log("Initializing table...");

// Params
const minimumBetAmount = 1000n; // in lamports
const roundPeriodTs = 60n; // in seconds

const signature = await sendInstructions(connection, admin, [
  createInitializeTableInstruction({ admin: admin.publicKey }, { minimumBetAmount, roundPeriodTs }),
]);

console.log("Config initialized:", signature);

const initialVaultFund = LAMPORTS_PER_SOL * 0.01;

if (initialVaultFund > 0) {
  console.log("Funding vault with", initialVaultFund / LAMPORTS_PER_SOL, "SOL");

  const ix = SystemProgram.transfer({
    fromPubkey: admin.publicKey,
    toPubkey: vault,
    lamports: initialVaultFund,
  });

  const tx = new Transaction().add(ix);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = admin.publicKey;
  const fundSignature = await sendAndConfirmTransaction(connection, tx, [admin]);

  console.log(`Vault funded: ${fundSignature}`);
}
