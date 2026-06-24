import { PublicKey } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";

export interface RoundPdaSeeds {
  roundNumber: bigint;
}

export function findRoundPda(
  seeds: RoundPdaSeeds,
  programId: PublicKey = MAGICROULETTE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    Buffer.from("round", "utf8"),
    Buffer.from(new Uint8Array(new BigUint64Array([BigInt(seeds.roundNumber)]).buffer)),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
