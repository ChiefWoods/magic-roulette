import { getOptionCodec, getStructCodec, getU64Codec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";
import { findTablePda } from "../pdas/table";
import { findVaultPda } from "../pdas/vault";

export interface WithdrawVaultInstructionAccounts {
  admin: PublicKey;
  vault?: PublicKey;
  table?: PublicKey;
  systemProgram?: PublicKey;
}

export interface WithdrawVaultInstructionArgs {
  amount: bigint | null;
}

const WithdrawVaultInstructionDataCodec = getStructCodec([
  ["amount", getOptionCodec(getU64Codec())],
]);

export function createWithdrawVaultInstruction(
  accounts: WithdrawVaultInstructionAccounts,
  args: WithdrawVaultInstructionArgs,
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
  const keys: AccountMeta[] = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: table, isSigner: false, isWritable: false },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(WithdrawVaultInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("8707ed78955e5f07", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
