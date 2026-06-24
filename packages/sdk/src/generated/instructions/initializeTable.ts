import { getStructCodec, getU64Codec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";
import { findTablePda } from "../pdas/table";
import { findVaultPda } from "../pdas/vault";

export interface InitializeTableInstructionAccounts {
  admin: PublicKey;
  vault?: PublicKey;
  table?: PublicKey;
  round?: PublicKey;
  systemProgram?: PublicKey;
}

export interface InitializeTableInstructionArgs {
  minimumBetAmount: bigint;
  roundPeriodTs: bigint;
}

const InitializeTableInstructionDataCodec = getStructCodec([
  ["minimumBetAmount", getU64Codec()],
  ["roundPeriodTs", getU64Codec()],
]);

export function createInitializeTableInstruction(
  accounts: InitializeTableInstructionAccounts,
  args: InitializeTableInstructionArgs,
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
  let round = accounts.round ?? new PublicKey("5iPGuWiwphA19XDLwpUoesiUbUkhwEfTnJZMFVkF3Cc9");
  const keys: AccountMeta[] = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: table, isSigner: false, isWritable: true },
    { pubkey: round, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(InitializeTableInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("df8ff6667ac86c93", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
