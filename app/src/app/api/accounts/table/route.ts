import { NextResponse } from "next/server";

import { fetchTable } from "@/lib/accounts";
import { MAGIC_ROULETTE_CLIENT } from "@/lib/server/solana";

export async function GET() {
  try {
    return NextResponse.json(
      {
        table: await fetchTable(MAGIC_ROULETTE_CLIENT),
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unable to fetch table account.",
      },
      {
        status: 500,
      },
    );
  }
}
