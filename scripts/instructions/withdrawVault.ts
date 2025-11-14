import { admin, program } from "../setup";
import { BN } from "@coral-xyz/anchor";

console.log("Withdrawing from vault...")

// Params
const amount = 1000; // in lamports

const signature = await program.methods
  .withdrawVault(new BN(amount))
  .accounts({
    admin: admin.publicKey,
  })
  .signers([admin])
  .rpc();

console.log("Withdrawn from vault:", signature);