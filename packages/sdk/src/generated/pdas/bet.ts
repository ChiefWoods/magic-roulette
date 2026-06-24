import { PublicKey } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";

export interface BetPdaSeeds {
  round: PublicKey;
  player: PublicKey;
}

export function findBetPda(
  seeds: BetPdaSeeds,
  programId: PublicKey = MAGICROULETTE_PROGRAM_ID,
): [PublicKey, number] {
  const seedsBuffer: Buffer[] = [
    Buffer.from("bet", "utf8"),
    seeds.round.toBuffer(),
    seeds.player.toBuffer(),
  ];
  return PublicKey.findProgramAddressSync(seedsBuffer, programId);
}
