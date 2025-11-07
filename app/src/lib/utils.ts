import { VersionedTransaction } from "@solana/web3.js";

export function v0TxToBase64(tx: VersionedTransaction): string {
  return Buffer.from(tx.serialize()).toString('base64');
}