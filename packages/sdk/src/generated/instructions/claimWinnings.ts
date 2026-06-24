import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";
import { findTablePda } from "../pdas/table";
import { findVaultPda } from "../pdas/vault";

export interface ClaimWinningsInstructionAccounts {
  player: PublicKey;
  vault?: PublicKey;
  table?: PublicKey;
  systemProgram?: PublicKey;
}

export interface ClaimWinningsInstructionArgs {
  roundBetAccounts: Array<PublicKey>;
}

export function createClaimWinningsInstruction(
  accounts: ClaimWinningsInstructionAccounts,
  args: ClaimWinningsInstructionArgs,
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
    { pubkey: accounts.player, isSigner: true, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: table, isSigner: false, isWritable: false },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  keys.push(
    ...args.roundBetAccounts.map((account) => ({
      pubkey: account,
      isSigner: false,
      isWritable: true,
    })),
  );
  const data = Buffer.from("a1d7183b0eecf2dd", "hex");

  return new TransactionInstruction({ keys, programId, data });
}
