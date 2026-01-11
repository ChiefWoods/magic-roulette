import { MAGIC_ROULETTE_CLIENT } from "@/lib/server/solana";
import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllRounds,
  fetchMultipleRounds,
  fetchRound,
} from "@/lib/accounts";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll("pda");
  const roundNumber = searchParams.get("roundNumber");
  const isSpun = searchParams.get("isSpun");

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          rounds: await fetchAllRounds(MAGIC_ROULETTE_CLIENT, {
            roundNumber: roundNumber ?? undefined,
            isSpun: isSpun ? isSpun.toLowerCase() === "true" : undefined,
          }),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          rounds: await fetchMultipleRounds(MAGIC_ROULETTE_CLIENT, pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          round: await fetchRound(MAGIC_ROULETTE_CLIENT, pdas[0]),
        },
        {
          status: 200,
        }
      );
    }
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to fetch round account(s).",
      },
      {
        status: 500,
      }
    );
  }
}
