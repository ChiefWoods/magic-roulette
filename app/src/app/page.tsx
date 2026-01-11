import { BetsProvider } from "@/providers/BetsProvider";
import { RoundInfo } from "@/components/RoundInfo";
import { RouletteTable } from "@/components/RouletteTable";
import { PlaceBetSection } from "@/components/PlaceBetSection";
import { BetHistory } from "@/components/BetHistory";
import { RoundsProvider } from "@/providers/RoundsProvider";
import { TableProvider } from "@/providers/TableProvider";
import { fetchAllRounds, fetchTable } from "@/lib/accounts";
import { MAGIC_ROULETTE_CLIENT } from "@/lib/server/solana";
import { BalanceProvider } from "@/providers/BalanceProvider";

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
          </BalanceProvider>
        </RoundsProvider>
      </BetsProvider>
    </TableProvider>
  );
}
