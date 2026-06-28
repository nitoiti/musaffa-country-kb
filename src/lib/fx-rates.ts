import { unstable_cache } from "next/cache";

/** Shown wherever live average rates are used */
export const EXCHANGE_RATE_DISCLAIMER =
  "Average market exchange rates — approximation only. Banks and Alpaca apply their own rates and fees at settlement, so the actual amount received may differ.";

export const EXCHANGE_RATE_SOURCE_LABEL = "Frankfurter (ECB reference data)";

/** Fallback when the API is unavailable — 1 unit of currency → USD */
export const FALLBACK_RATES_TO_USD: Record<string, number> = {
  EUR: 1.08,
  CHF: 1.12,
  SEK: 0.096,
  AED: 0.27,
  SGD: 0.74,
  GBP: 1.27,
  PLN: 0.25,
  NOK: 0.093,
  DKK: 0.14,
  CZK: 0.043,
  HUF: 0.0027,
  AUD: 0.65,
  CAD: 0.73,
};

export type ExchangeRateResult = {
  from: string;
  to: string;
  /** 1 `from` = `rate` `to` */
  rate: number;
  date: string;
  source: "frankfurter" | "fallback";
  disclaimer: string;
};

async function fetchFrankfurter(
  from: string,
  to: string,
): Promise<{ rate: number; date: string } | null> {
  const fromCcy = from.toUpperCase();
  const toCcy = to.toUpperCase();
  if (fromCcy === toCcy) {
    return { rate: 1, date: new Date().toISOString().slice(0, 10) };
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${fromCcy}&to=${toCcy}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      date?: string;
      rates?: Record<string, number>;
    };
    const rate = data.rates?.[toCcy];
    if (rate == null || !data.date) return null;
    return { rate, date: data.date };
  } catch {
    return null;
  }
}

function fallbackRate(from: string, to: string): ExchangeRateResult {
  const fromCcy = from.toUpperCase();
  const toCcy = to.toUpperCase();
  const today = new Date().toISOString().slice(0, 10);

  if (fromCcy === toCcy) {
    return {
      from: fromCcy,
      to: toCcy,
      rate: 1,
      date: today,
      source: "fallback",
      disclaimer: EXCHANGE_RATE_DISCLAIMER,
    };
  }

  const fromUsd = FALLBACK_RATES_TO_USD[fromCcy];
  const toUsd = FALLBACK_RATES_TO_USD[toCcy];

  let rate = 1;
  if (toCcy === "USD" && fromUsd) {
    rate = fromUsd;
  } else if (fromCcy === "USD" && toUsd) {
    rate = roundRate(1 / toUsd);
  } else if (fromUsd && toUsd) {
    rate = roundRate(fromUsd / toUsd);
  }

  return {
    from: fromCcy,
    to: toCcy,
    rate,
    date: today,
    source: "fallback",
    disclaimer: EXCHANGE_RATE_DISCLAIMER,
  };
}

function roundRate(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<ExchangeRateResult> {
  const fromCcy = from.toUpperCase();
  const toCcy = to.toUpperCase();

  const live = await fetchFrankfurter(fromCcy, toCcy);
  if (live) {
    return {
      from: fromCcy,
      to: toCcy,
      rate: live.rate,
      date: live.date,
      source: "frankfurter",
      disclaimer: EXCHANGE_RATE_DISCLAIMER,
    };
  }

  return fallbackRate(fromCcy, toCcy);
}

/** Cached for 1 hour per currency pair */
export async function getCachedExchangeRate(
  from: string,
  to: string,
): Promise<ExchangeRateResult> {
  const fromCcy = from.toUpperCase();
  const toCcy = to.toUpperCase();
  return unstable_cache(
    async () => getExchangeRate(fromCcy, toCcy),
    ["exchange-rate", fromCcy, toCcy],
    { revalidate: 3600 },
  )();
}
