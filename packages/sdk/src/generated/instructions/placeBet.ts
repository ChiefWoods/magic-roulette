import { getStructCodec, getU64Codec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";
import { findBetPda } from "../pdas/bet";
import { findTablePda } from "../pdas/table";
import { findVaultPda } from "../pdas/vault";
import { BetType, betTypeCodec } from "../types/betType";

export interface PlaceBetInstructionAccounts {
  player: PublicKey;
  vault?: PublicKey;
  table?: PublicKey;
  round: PublicKey;
  bet?: PublicKey;
  systemProgram?: PublicKey;
}

export interface PlaceBetInstructionArgs {
  betType: BetType;
  betAmount: bigint;
}

const PlaceBetInstructionDataCodec = getStructCodec([
  ["betType", betTypeCodec],
  ["betAmount", getU64Codec()],
]);

export function createPlaceBetInstruction(
  accounts: PlaceBetInstructionAccounts,
  args: PlaceBetInstructionArgs,
  programId: PublicKey = MAGICROULETTE_PROGRAM_ID,
): TransactionInstruction {
  const systemProgram = accounts.systemProgram ?? new PublicKey("11111111111111111111111111111111");
  let vault = accounts.vault;
  if (!vault) {
    const [derived] = findVaultPda(programId);
    vault = derived;
  }
  let table = accounts.table;
  if (!table) {
    const [derived] = findTablePda(programId);
    table = derived;
  }
  let bet = accounts.bet;
  if (!bet) {
    const [derived] = findBetPda(
      {
        round: accounts.round,
        player: accounts.player,
      },
      programId,
    );
    bet = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.player, isSigner: true, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: table, isSigner: false, isWritable: false },
    { pubkey: accounts.round, isSigner: false, isWritable: true },
    { pubkey: bet, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(PlaceBetInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("de3e43dc3fa67e21", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
