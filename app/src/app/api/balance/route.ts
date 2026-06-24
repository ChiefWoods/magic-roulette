import { PublicKey } from "@solana/web3.js";
import { NextRequest, NextResponse } from "next/server";

import { CONNECTION } from "@/lib/server/solana";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publicKey = searchParams.get("publicKey");

    if (!publicKey) {
      return NextResponse.json({ error: "Public key is required" }, { status: 400 });
    }

    const balance = await CONNECTION.getBalance(new PublicKey(publicKey));

    return NextResponse.json({ balance });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch balance.",
      },
      { status: 500 },
    );
  }
}
