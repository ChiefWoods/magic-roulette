import { PublicKey } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";

export function findProgramIdentityPda(
  programId: PublicKey = MAGICROULETTE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [Buffer.from("identity", "utf8")];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
