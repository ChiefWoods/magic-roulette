import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";
import { findProgramIdentityPda } from "../pdas/programIdentity";
import { findTablePda } from "../pdas/table";

export interface SpinRouletteInstructionAccounts {
  payer: PublicKey;
  table?: PublicKey;
  currentRound: PublicKey;
  newRound: PublicKey;
  oracleQueue?: PublicKey;
  programIdentity?: PublicKey;
  vrfProgram?: PublicKey;
  slotHashes?: PublicKey;
  systemProgram?: PublicKey;
}

export function createSpinRouletteInstruction(
  accounts: SpinRouletteInstructionAccounts,
  programId: PublicKey = MAGICROULETTE_PROGRAM_ID,
): TransactionInstruction {
  const systemProgram = accounts.systemProgram ?? new PublicKey("11111111111111111111111111111111");
  const oracleQueue =
    accounts.oracleQueue ?? new PublicKey("Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh");
  const vrfProgram =
    accounts.vrfProgram ?? new PublicKey("Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz");
  const slotHashes =
    accounts.slotHashes ?? new PublicKey("SysvarS1otHashes111111111111111111111111111");
  let table = accounts.table;
  if (!table) {
    const [derived] = findTablePda(programId);
    table = derived;
  }
  let programIdentity = accounts.programIdentity;
  if (!programIdentity) {
    const [derived] = findProgramIdentityPda(programId);
    programIdentity = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.payer, isSigner: true, isWritable: true },
    { pubkey: table, isSigner: false, isWritable: false },
    { pubkey: accounts.currentRound, isSigner: false, isWritable: true },
    { pubkey: accounts.newRound, isSigner: false, isWritable: true },
    { pubkey: oracleQueue, isSigner: false, isWritable: true },
    { pubkey: programIdentity, isSigner: false, isWritable: false },
    { pubkey: vrfProgram, isSigner: false, isWritable: false },
    { pubkey: slotHashes, isSigner: false, isWritable: false },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  const data = Buffer.from("0682f826a19b111e", "hex");

  return new TransactionInstruction({ keys, programId, data });
}
