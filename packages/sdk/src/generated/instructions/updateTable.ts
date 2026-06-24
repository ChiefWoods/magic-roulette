import {
  fixCodecSize,
  getBytesCodec,
  getOptionCodec,
  getStructCodec,
  getU64Codec,
  transformCodec,
} from "@solana/codecs";
import { AccountMeta, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { MAGICROULETTE_PROGRAM_ID } from "..";
import { findTablePda } from "../pdas/table";

export interface UpdateTableInstructionAccounts {
  admin: PublicKey;
  table?: PublicKey;
}

export interface UpdateTableInstructionArgs {
  minimumBetAmount: bigint | null;
  roundPeriodTs: bigint | null;
  newAdmin: PublicKey | null;
}

const UpdateTableInstructionDataCodec = getStructCodec([
  ["minimumBetAmount", getOptionCodec(getU64Codec())],
  ["roundPeriodTs", getOptionCodec(getU64Codec())],
  [
    "newAdmin",
    getOptionCodec(
      transformCodec(
        fixCodecSize(getBytesCodec(), 32),
        (value: PublicKey) => value.toBytes(),
        (value) => new PublicKey(value),
      ),
    ),
  ],
]);

export function createUpdateTableInstruction(
  accounts: UpdateTableInstructionAccounts,
  args: UpdateTableInstructionArgs,
  programId: PublicKey = MAGICROULETTE_PROGRAM_ID,
): TransactionInstruction {
  let table = accounts.table;
  if (!table) {
    const [derived] = findTablePda(programId);
    table = derived;
  }
  const keys: AccountMeta[] = [
    { pubkey: accounts.admin, isSigner: true, isWritable: true },
    { pubkey: table, isSigner: false, isWritable: true },
  ];
  const instructionData = Buffer.from(UpdateTableInstructionDataCodec.encode(args));
  const discriminator = Buffer.from("e0170a30b54979bb", "hex");
  const data = Buffer.concat([discriminator, instructionData]);

  return new TransactionInstruction({ keys, programId, data });
}
