import { BetHistory } from "@/components/BetHistory";
import { PlaceBetSection } from "@/components/PlaceBetSection";
import { RouletteTable } from "@/components/RouletteTable";
import { RoundInfo } from "@/components/RoundInfo";
import { fetchAllRounds, fetchTable } from "@/lib/accounts";
import { MAGIC_ROULETTE_CLIENT } from "@/lib/server/solana";
import { BalanceProvider } from "@/providers/BalanceProvider";
import { BetsProvider } from "@/providers/BetsProvider";
import { RoundsProvider } from "@/providers/RoundsProvider";
import { TableProvider } from "@/providers/TableProvider";

export default async function Page() {
  const table = await fetchTable(MAGIC_ROULETTE_CLIENT);

  if (!table) {
    throw new Error("Table is not initialized.");
  }

  const rounds = await fetchAllRounds(MAGIC_ROULETTE_CLIENT);

  return (
    <TableProvider fallbackData={table}>
      <BetsProvider>
        <RoundsProvider fallbackData={rounds}>
          <BalanceProvider>
            <section className="flex w-fit flex-col items-center gap-8 px-2 py-4">
              <section className="flex flex-col items-start gap-8 xl:flex-row">
                <RouletteTable />
                <section className="flex w-full flex-col gap-4 lg:flex-row xl:flex-col xl:justify-between">
                  <RoundInfo />
                  <PlaceBetSection />
                </section>
              </section>
              <BetHistory />
            </section>
          </BalanceProvider>
        </RoundsProvider>
      </BetsProvider>
    </TableProvider>
  );
}
