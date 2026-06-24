import { createWithdrawVaultInstruction } from "@magic-roulette/sdk";

import { admin, connection, sendInstructions } from "../setup";

console.log("Withdrawing from vault...");

// Params
const amount = 1000n; // in lamports

const signature = await sendInstructions(connection, admin, [
  createWithdrawVaultInstruction({ admin: admin.publicKey }, { amount }),
]);

console.log("Withdrawn from vault:", signature);
