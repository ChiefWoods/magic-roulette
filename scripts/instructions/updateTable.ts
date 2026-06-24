import { createUpdateTableInstruction } from "@magic-roulette/sdk";

import { admin, connection, sendInstructions } from "../setup";

console.log("Updating table...");

// Params
const minimumBetAmount = 1000n; // in lamports
const roundPeriodTs = 60n; // in seconds
const newAdmin = admin.publicKey;

const signature = await sendInstructions(connection, admin, [
  createUpdateTableInstruction(
    { admin: admin.publicKey },
    { minimumBetAmount, roundPeriodTs, newAdmin },
  ),
]);

console.log("Table updated:", signature);
