"use client";

import { BetsProvider } from "@/providers/BetsProvider";
import { useProgram } from "@/providers/ProgramProvider";
import { RoundProvider } from "@/providers/RoundProvider";
import { useTable } from "@/providers/TableProvider";
import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { BN } from "@coral-xyz/anchor";
import { Spinner } from "@/components/ui/spinner";
import { RoundInfo } from "@/components/RoundInfo";
import { RouletteTable } from "@/components/RouletteTable";
import { PlaceBetSection } from "@/components/PlaceBetSection";
import { BetHistory } from "@/components/BetHistory";

function Main() {
  return (
    <section className="flex flex-col gap-8 py-4 w-fit items-center">
      <section className="flex xl:flex-row flex-col gap-8 items-start">
        <RouletteTable />
        <section className="flex flex-col xl:flex-col lg:flex-row gap-4 xl:justify-between w-full">
          <RoundInfo />
          <PlaceBetSection />
        </section>
      </section>
      <BetHistory />
    </section>
  );
}

export default function Page() {
  const { magicRouletteClient } = useProgram();
  const { publicKey } = useUnifiedWallet();
  const { tableData, tableLoading } = useTable();

  if (tableLoading) {
    return (
      <section className="flex flex-col justify-center items-center gap-4 flex-1">
        <Spinner className="size-10 text-accent" />
        <p className="font-semibold text-accent">Loading...</p>
      </section>
    );
  }

  // only load all bets when wallet is connected
  return publicKey ? (
    <BetsProvider player={publicKey.toBase58()}>
      {tableData && (
        <RoundProvider
          pda={magicRouletteClient
            .getRoundPda(new BN(Number(tableData.currentRoundNumber)))
            .toBase58()}
        >
          <Main />
        </RoundProvider>
      )}
    </BetsProvider>
  ) : (
    tableData && (
      <RoundProvider
        pda={magicRouletteClient
          .getRoundPda(new BN(Number(tableData.currentRoundNumber)))
          .toBase58()}
      >
        <Main />
      </RoundProvider>
    )
  );
}
