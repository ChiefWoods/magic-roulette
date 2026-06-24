import { fixCodecSize, getBytesCodec, getStructCodec } from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";
import { findTablePda } from "../pdas/table";

export interface AdvanceRoundInstructionAccounts {
  vrfProgramIdentity: PublicKey;
  table?: PublicKey;
  currentRound: PublicKey;
  newRound: PublicKey;
  systemProgram?: PublicKey;
}

export interface AdvanceRoundInstructionArgs {
  randomness: Uint8Array;
}

const AdvanceRoundInstructionDataCodec = getStructCodec([
  ["randomness", fixCodecSize(getBytesCodec(), 32)],
]);

export function createAdvanceRoundInstruction(
  accounts: AdvanceRoundInstructionAccounts,
  args: AdvanceRoundInstructionArgs,
  programId: PublicKey = MAGICROULETTE_PROGRAM_ID,
): TransactionInstruction {
  const systemProgram = accounts.systemProgram ?? new PublicKey("11111111111111111111111111111111");
  let table = accounts.table;
  if (!table) {
    const [derived] = findTablePda(programId);
    table = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.vrfProgramIdentity, isSigner: true, isWritable: false },
    { pubkey: table, isSigner: false, isWritable: true },
    { pubkey: accounts.currentRound, isSigner: false, isWritable: true },
    { pubkey: accounts.newRound, isSigner: false, isWritable: true },
    { pubkey: systemProgram, isSigner: false, isWritable: false },
  ];
  const instructionData = Buffer.from(AdvanceRoundInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("e65877503604d4fa", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
