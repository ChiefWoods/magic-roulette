import { Address, BN } from '@coral-xyz/anchor';
import { AccountMeta, Connection } from '@solana/web3.js';
import magicRouletteIdl from '@/idl/magic-roulette.json';
import { PublicKey } from '@solana/web3.js';
import {
  BetType,
  bigIntString,
  ParsedBetType,
  unparseEnum,
} from '@/types/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import { ProgramClient } from './program-client';
import { MagicRoulette } from '@/types/magic-roulette';
import { DEFAULT_QUEUE } from './constants';

export class MagicRouletteClient extends ProgramClient<MagicRoulette> {
  constructor(connection: Connection) {
    super(connection, magicRouletteIdl);
  }

  getBetPda(round: PublicKey, betTypeIndex: number) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("bet"),
        round.toBuffer(),
        new BN(betTypeIndex).toArrayLike(Buffer, "le", 1),
      ],
      this.program.programId
    )[0];
  }

  getTablePda() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("table")],
      this.program.programId
    )[0];
  }

  getVaultPda() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      this.program.programId
    )[0];
  }

  getRoundPda(roundNumber: BN) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("round"), roundNumber.toArrayLike(Buffer, "le", 8)],
      this.program.programId
    )[0];
  }

  async placeBetIx({
    betType,
    betAmount,
    player,
    bet,
  }: {
    betType: ParsedBetType;
    betAmount: bigIntString;
    player: Address;
    bet: Address;
  } & {
    authority: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .placeBet(unparseEnum<BetType>(betType), new BN(betAmount))
      .accountsPartial({
        player,
        bet,
      })
      .instruction();
  }

  async spinRouletteIx({
    payer,
    newRound,
  }: {
    payer: Address;
    newRound: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .spinRoulette()
      .accounts({
        payer,
        newRound,
        oracleQueue: DEFAULT_QUEUE,
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
