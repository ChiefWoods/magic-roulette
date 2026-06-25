import { PublicKey, SystemProgram } from "@solana/web3.js";

export interface ParsedProgramAccount {
  address: string;
}

export function parseProgramAccount<T, D>(
  account: { address: PublicKey; data: T },
  parse: (data: T) => D,
): ParsedProgramAccount & { data: D } {
  return { address: parsePublicKey(account.address), data: parse(account.data) };
}

export function parsePublicKey(field: PublicKey | null): string {
  // default publicKey is SystemProgram ID
  return !field || field.equals(SystemProgram.programId) ? "" : field.toBase58();
}

export function parseBigInt(field: bigint): string {
  return field.toString();
}

export type OptionValue<T> = T | null | { __option: "None" } | { __option: "Some"; value: T };

export function parseOption<T>(option: OptionValue<T>): T | null {
  if (option === null) return null;

  if (typeof option === "object" && "__option" in option) {
    return option.__option === "Some" ? option.value : null;
  }

  return option;
}
