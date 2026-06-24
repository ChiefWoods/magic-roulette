import {
  fixCodecSize,
  getBooleanCodec,
  getBytesCodec,
  getStructCodec,
  getU64Codec,
  getU8Codec,
  transformCodec,
} from "@solana/codecs";
import { Connection, GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

import { BetType, betTypeCodec } from "../types/betType";

export interface BetAccountData {
  player: PublicKey;
  round: PublicKey;
  amount: bigint;
  bump: number;
  isClaimed: boolean;
  betType: BetType;
}

export interface BetAccount {
  address: PublicKey;
  data: BetAccountData;
}

const BetAccountDataCodec = getStructCodec([
  ["discriminator", fixCodecSize(getBytesCodec(), 8)],
  [
    "player",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  [
    "round",
    transformCodec(
      fixCodecSize(getBytesCodec(), 32),
      (value: PublicKey) => value.toBytes(),
      (value) => new PublicKey(value),
    ),
  ],
  ["amount", getU64Codec()],
  ["bump", getU8Codec()],
  ["isClaimed", getBooleanCodec()],
  ["betType", betTypeCodec],
]);

export function deserializeBetAccount(data: Uint8Array): BetAccountData {
  const deserialized = BetAccountDataCodec.decode(data);
  const { discriminator: _, ...accountData } = deserialized;
  return accountData as BetAccountData;
}

export async function fetchBetAccount(
  connection: Connection,
  address: PublicKey,
): Promise<BetAccount> {
  const accountInfo = await connection.getAccountInfo(address);
  if (!accountInfo) {
    throw new Error("Bet account not found at address: " + address.toBase58());
  }
  return {
    address,
    data: deserializeBetAccount(accountInfo.data),
  };
}

export async function fetchAllMaybeBetAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<(BetAccount | null)[]> {
  const accountInfos = await connection.getMultipleAccountsInfo(addresses);
  return accountInfos.map((accountInfo, index) => {
    if (!accountInfo) {
      return null;
    }
    return {
      address: addresses[index]!,
      data: deserializeBetAccount(accountInfo.data),
    };
  });
}

export async function fetchAllBetAccounts(
  connection: Connection,
  addresses: PublicKey[],
): Promise<BetAccount[]> {
  const maybeAccounts = await fetchAllMaybeBetAccounts(connection, addresses);
  const missingAddresses = maybeAccounts
    .flatMap((account, i) => (!account ? [addresses[i]!.toBase58()] : []))
    .join(", ");
  if (missingAddresses) {
    throw new Error("Bet account(s) not found at address(es): " + missingAddresses);
  }
  return maybeAccounts.filter((a): a is BetAccount => a !== null);
}

export async function fetchProgramAccountsBet(
  connection: Connection,
  programId: PublicKey,
  options?: {
    commitment?: "processed" | "confirmed" | "finalized";
    filters?: GetProgramAccountsFilter[];
  },
): Promise<BetAccount[]> {
  const accounts = await connection.getProgramAccounts(programId, {
    commitment: options?.commitment,
    filters: [{ memcmp: { offset: 0, bytes: "RbxjeDxFruM" } }, ...(options?.filters ?? [])],
  });
  return accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    data: deserializeBetAccount(account.data),
  }));
}
