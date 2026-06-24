import {
  fixCodecSize,
  getBooleanCodec,
  getBytesCodec,
  getOptionCodec,
  getStructCodec,
  getU64Codec,
  getU8Codec,
} from "@solana/codecs";
import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

export interface RoundAccountData {
  roundNumber: bigint;
  poolAmount: bigint;
  isSpun: boolean;
  bump: number;
  outcome: number | null;
}

export interface RoundAccount {
  address: PublicKey;
  data: RoundAccountData;
}

const RoundAccountDataCodec = getStructCodec([
  ["discriminator", fixCodecSize(getBytesCodec(), 8)],
  ["roundNumber", getU64Codec()],
  ["poolAmount", getU64Codec()],
  ["isSpun", getBooleanCodec()],
  ["bump", getU8Codec()],
  ["outcome", getOptionCodec(getU8Codec())],
]);

export function deserializeRoundAccount(data: Uint8Array): RoundAccountData {
  const deserialized = RoundAccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as RoundAccountData;
}

export async function fetchRoundAccount(
  connection: Connection,
  address: PublicKey,
): Promise<RoundAccount> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("Round account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializeRoundAccount(accountInfo.data),
  };
}

export async function fetchAllMaybeRoundAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(RoundAccount | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index]!,
      data: deserializeRoundAccount(accountInfo.data),
    };
  });
}

export async function fetchAllRoundAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<RoundAccount[]> {
  const maybeAccounts = await fetchAllMaybeRoundAccounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i]!.toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("Round account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is RoundAccount => a !== null);
}

export async function fetchProgramAccountsRound(
  connection: Connection,
  programId: PublicKey,
  options?: {
    commitment?: "processed" | "confirmed" | "finalized";
    filters?: GetProgramAccountsFilter[];
  },
): Promise<RoundAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "Fdr5W8SQEA9" } }, ...(options?.filters ?? [])],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializeRoundAccount(account.data),
  }));
}
