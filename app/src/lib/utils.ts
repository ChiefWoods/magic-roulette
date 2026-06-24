import { Cluster, VersionedTransaction } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function v0TxToBase64(tx: VersionedTransaction): string {
  return Buffer.from(tx.serialize()).toString("base64");
}

export function boolToByte(value: boolean): string {
  return Buffer.from([value ? 1 : 0]).toString("base64");
}

export function bigIntToBase64(value: bigint): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value);
  return buf.toString("base64");
}

// https://github.com/solana-developers/helpers/blob/main/src/lib/explorer.ts#L20
const encodeURL = (baseUrl: string, searchParams: Record<string, string>) => {
  const url = new URL(baseUrl);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
};

// https://github.com/solana-developers/helpers/blob/main/src/lib/explorer.ts#L30
export const getExplorerLink = (
  linkType: "transaction" | "tx" | "address" | "block",
  id: string,
  cluster: Cluster | "localnet" = "mainnet-beta",
): string => {
  const searchParams: Record<string, string> = {};
  if (cluster !== "mainnet-beta") {
    if (cluster === "localnet") {
      // localnet technically isn't a cluster, so requires special handling
      searchParams["cluster"] = "custom";
      searchParams["customUrl"] = "http://localhost:8899";
    } else {
      searchParams["cluster"] = cluster;
    }
  }
  let baseUrl: string = "";
  if (linkType === "address") {
    baseUrl = `https://explorer.solana.com/address/${id}`;
  }
  if (linkType === "transaction" || linkType === "tx") {
    baseUrl = `https://explorer.solana.com/tx/${id}`;
  }
  if (linkType === "block") {
    baseUrl = `https://explorer.solana.com/block/${id}`;
  }
  return encodeURL(baseUrl, searchParams);
};

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }

  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function timestampToMilli(ts: number): number {
  return ts * 1000;
}

export function milliToTimestamp(ms: number): number {
  return Math.floor(ms / 1000);
}

export function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function parseSolToLamports(sol: string): string {
  // Remove any non-digit and non-decimal characters
  const cleanStr = sol.replace(/[^\d.]/g, "");

  // Split into integer and decimal parts
  const parts = cleanStr.split(".");
  const integerPart = parts[0] || "0";
  const decimalPart = (parts[1] || "").padEnd(9, "0").slice(0, 9);

  // Combine and remove leading zeros
  const lamports = (integerPart + decimalPart).replace(/^0+/, "") || "0";

  return lamports;
}

export function parseLamportsToSol(lamports: string): string {
  // Remove any non-digit characters
  const cleanStr = lamports.replace(/\D/g, "");

  // Pad with leading zeros if needed (for amounts less than 1 SOL)
  const paddedStr = cleanStr.padStart(10, "0");

  // Split into integer and decimal parts (9 decimal places for lamports)
  const len = paddedStr.length;
  const integerPart = paddedStr.slice(0, len - 9) || "0";
  const decimalPart = paddedStr.slice(len - 9);

  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimalPart.replace(/0+$/, "");

  return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
}
