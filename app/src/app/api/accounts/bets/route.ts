import { fetchAllBets, fetchBet, fetchMultipleBets } from "@/lib/accounts";
import { MAGIC_ROULETTE_CLIENT } from "@/lib/server/solana";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll("pda");
  const roundPda = searchParams.get("round");
  const player = searchParams.get("player");
  const isClaimed = searchParams.get("isClaimed");
  const isWinning = searchParams.get("isWinning");

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          bets: await fetchAllBets(MAGIC_ROULETTE_CLIENT, {
            player: player ?? undefined,
            round: roundPda ?? undefined,
            isClaimed: isClaimed
              ? isClaimed.toLowerCase() === "true"
              : undefined,
            isWinning: isWinning
              ? isWinning.toLowerCase() === "true"
              : undefined,
          }),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          bets: await fetchMultipleBets(MAGIC_ROULETTE_CLIENT, pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          bet: await fetchBet(MAGIC_ROULETTE_CLIENT, pdas[0]),
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
            : "Unable to fetch bet account(s).",
      },
      {
        status: 500,
      }
    );
  }
}
