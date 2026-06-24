import { PublicKey } from "@solana/web3.js";

export const MAGICROULETTE_PROGRAM_ID = new PublicKey(
  "RoUnLrec2JvYFMf6ZWnK2wgK8xKaUjwi1GEUPf6fFiF",
);

export * from "./constants";
export * from "./accounts/bet";
export * from "./accounts/round";
export * from "./accounts/table";
export * from "./instructions/advanceRound";
export * from "./instructions/claimWinnings";
export * from "./instructions/initializeTable";
export * from "./instructions/placeBet";
export * from "./instructions/spinRoulette";
export * from "./instructions/updateTable";
export * from "./instructions/withdrawVault";
export * from "./pdas/table";
export * from "./pdas/vault";
export * from "./pdas/bet";
export * from "./pdas/programIdentity";
export * from "./pdas/round";
export * from "./types/betType";
