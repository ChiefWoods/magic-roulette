import { NextResponse } from "next/server";

import { fetchTable } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";

export async function GET() {
  try {
    return NextResponse.json(
      {
        table: await fetchTable(CONNECTION),
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
