import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { MagicRoulette } from "../target/types/magic_roulette";
import idl from "../target/idl/magic_roulette.json";
import { MagicRouletteClient } from "./client";

export const admin = Keypair.fromSecretKey(
  new Uint8Array(await Bun.file(process.env.ANCHOR_WALLET).json())
)
export const connection = new Connection(process.env.ANCHOR_PROVIDER_URL || clusterApiUrl('devnet'))
const provider = new AnchorProvider(connection, new Wallet(admin))
export const program = new Program<MagicRoulette>(idl, provider);
export const magicRouletteClient = new MagicRouletteClient(program);

export const [vault] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
  ],
  program.programId
)