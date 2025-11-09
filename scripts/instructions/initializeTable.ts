import { BN } from "@coral-xyz/anchor";
import { admin, connection, program, vault } from "../setup";
import { LAMPORTS_PER_SOL, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";

console.log("Initializing table...")

// Params
const minimumBetAmount = 1000; // in lamports
const roundPeriodTs = 60; // in seconds

const signature = await program.methods
  .initializeTable(new BN(minimumBetAmount), new BN(roundPeriodTs))
  .accounts({
    admin: admin.publicKey,
  })
  .signers([admin])
  .rpc();

console.log("Config initialized:", signature);

const initialVaultFund = LAMPORTS_PER_SOL * 0.01;

if (initialVaultFund > 0) {
  console.log("Funding vault with", initialVaultFund / LAMPORTS_PER_SOL, "SOL");

  const ix = SystemProgram.transfer({
    fromPubkey: admin.publicKey,
    toPubkey: vault,
    lamports: initialVaultFund,
  })

  const tx = new Transaction().add(ix);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = admin.publicKey;
  const signature = await sendAndConfirmTransaction(connection, tx, [admin]);

  console.log(`Vault funded: ${signature}`);
}