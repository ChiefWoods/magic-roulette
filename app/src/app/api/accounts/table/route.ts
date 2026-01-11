import { fetchTable } from "@/lib/accounts";
import { MAGIC_ROULETTE_CLIENT } from "@/lib/server/solana";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(
      {
        table: await fetchTable(MAGIC_ROULETTE_CLIENT),
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Unable to fetch table account.",
      },
      {
        status: 500,
      }
    );
  }
}
