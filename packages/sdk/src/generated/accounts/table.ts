import {
  fixCodecSize,
  getBytesCodec,
  getI64Codec,
  getStructCodec,
  getU64Codec,
  getU8Codec,
  transformCodec,
} from "@solana/codecs";
import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

export interface TableAccountData {
  admin: PublicKey;
  minimumBetAmount: bigint;
  currentRoundNumber: bigint;
  nextRoundTs: bigint;
  roundPeriodTs: bigint;
  bump: number;
  vaultBump: number;
}

export interface TableAccount {
  address: PublicKey;
  data: TableAccountData;
}

const TableAccountDataCodec = getStructCodec([
  ["discriminator", fixCodecSize(getBytesCodec(), 8)],
  [
    "admin",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["minimumBetAmount", getU64Codec()],
  ["currentRoundNumber", getU64Codec()],
  ["nextRoundTs", getI64Codec()],
  ["roundPeriodTs", getU64Codec()],
  ["bump", getU8Codec()],
  ["vaultBump", getU8Codec()],
]);

export function deserializeTableAccount(data: Uint8Array): TableAccountData {
  const deserialized = TableAccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as TableAccountData;
}

export async function fetchTableAccount(
  connection: Connection,
  address: PublicKey,
): Promise<TableAccount> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("Table account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializeTableAccount(accountInfo.data),
  };
}

export async function fetchAllMaybeTableAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(TableAccount | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index]!,
      data: deserializeTableAccount(accountInfo.data),
    };
  });
}

export async function fetchAllTableAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<TableAccount[]> {
  const maybeAccounts = await fetchAllMaybeTableAccounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i]!.toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("Table account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is TableAccount => a !== null);
}

export async function fetchProgramAccountsTable(
  connection: Connection,
  programId: PublicKey,
  options?: {
    commitment?: "processed" | "confirmed" | "finalized";
    filters?: GetProgramAccountsFilter[];
  },
): Promise<TableAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "6kerSHaGRJF" } }, { dataSize: 74 }],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializeTableAccount(account.data),
  }));
}
