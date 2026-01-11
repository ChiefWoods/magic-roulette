import { Address, BN } from "@coral-xyz/anchor";
import { AccountMeta, Connection } from "@solana/web3.js";
import magicRouletteIdl from "@/idl/magic-roulette.json";
import { PublicKey } from "@solana/web3.js";
import { BetType, bigIntString } from "@/types/accounts";
import { TransactionInstruction } from "@solana/web3.js";
import { ProgramClient } from "./ProgramClient";
import { MagicRoulette } from "@/types/magic-roulette";

export class MagicRouletteClient extends ProgramClient<MagicRoulette> {
  static PROGRAM_ID = new PublicKey(magicRouletteIdl.address);

  constructor(connection: Connection) {
    super(connection, magicRouletteIdl);
  }

  static tablePda = this.getTablePda();
  static vaultPda = this.getVaultPda();

  static getBetPda(round: PublicKey, player: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), round.toBuffer(), player.toBuffer()],
      this.PROGRAM_ID
    )[0];
  }

  static getTablePda() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("table")],
      this.PROGRAM_ID
    )[0];
  }

  static getVaultPda() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      this.PROGRAM_ID
    )[0];
  }

  static getRoundPda(roundNumber: BN) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("round"), roundNumber.toArrayLike(Buffer, "le", 8)],
      this.PROGRAM_ID
    )[0];
  }

  async placeBetIx({
    betType,
    betAmount,
    player,
  }: {
    betType: BetType;
    betAmount: bigIntString;
    player: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .placeBet(betType, new BN(betAmount))
      .accounts({
        player,
      })
      .instruction();
  }

  async spinRouletteIx({
    payer,
    currentRound,
    newRound,
  }: {
    payer: Address;
    currentRound: Address;
    newRound: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .spinRoulette()
      .accountsPartial({
        payer,
        currentRound,
        newRound,
      })
      .instruction();
  }

  async claimWinningsIx({
    player,
    roundAndBets,
  }: {
    player: Address;
    roundAndBets: { round: Address; bet: Address }[];
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .claimWinnings()
      .accounts({
        player,
      })
      .remainingAccounts(
        roundAndBets.reduce<AccountMeta[]>((acc, { round, bet }) => {
          acc.push(
            { pubkey: new PublicKey(round), isSigner: false, isWritable: true },
            { pubkey: new PublicKey(bet), isSigner: false, isWritable: true }
          );
          return acc;
        }, [])
      )
      .instruction();
  }
}
