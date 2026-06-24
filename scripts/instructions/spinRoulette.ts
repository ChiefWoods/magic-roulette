import {
  createSpinRouletteInstruction,
  fetchTableAccount,
  findRoundPda,
  findTablePda,
} from "@magic-roulette/sdk";

import { admin, connection, sendInstructions } from "../setup";

console.log("Spinning roulette...");

const [tablePda] = findTablePda();
const tableAcc = (await fetchTableAccount(connection, tablePda)).data;
const currentRoundNumber = tableAcc.currentRoundNumber;
const [currentRoundPda] = findRoundPda({ roundNumber: currentRoundNumber });
const [newRoundPda] = findRoundPda({ roundNumber: currentRoundNumber + 1n });

const signature = await sendInstructions(connection, admin, [
  createSpinRouletteInstruction({
    payer: admin.publicKey,
    currentRound: currentRoundPda,
    newRound: newRoundPda,
  }),
]);

console.log("Roulette spun:", signature);
