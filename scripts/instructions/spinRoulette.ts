import { admin, magicRouletteClient, program } from "../setup"

console.log("Spinning roulette...")

// const tableAcc = (await program.account.table.all())[0];
const tableAcc = (await magicRouletteClient.fetchAllProgramAccounts("table"))[0];
const currentRoundPda = magicRouletteClient.getRoundPda(tableAcc.account.currentRoundNumber);
const nextRoundNumber = tableAcc.account.currentRoundNumber.addn(1);
const newRoundPda = magicRouletteClient.getRoundPda(nextRoundNumber);

const signature = await program.methods
  .spinRoulette()
  .accountsPartial({
    payer: admin.publicKey,
    currentRound: currentRoundPda,
    newRound: newRoundPda,
  })
  .signers([admin])
  .rpc();

console.log("Roulette spun:", signature);
