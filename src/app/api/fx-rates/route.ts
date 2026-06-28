import { NextResponse } from "next/server";
import { getCachedExchangeRate } from "@/lib/fx-rates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = (searchParams.get("from") ?? "EUR").toUpperCase();
  const to = (searchParams.get("to") ?? "USD").toUpperCase();

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    return NextResponse.json(
      { error: "from and to must be 3-letter currency codes" },
      { status: 400 },
    );
  }

  const result = await getCachedExchangeRate(from, to);
  return NextResponse.json(result);
}
