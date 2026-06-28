import type { CountryFees } from "@/types/country";

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  );
}

export function FeesPanel({ fees }: { fees: CountryFees }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
            A
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Alpaca Fees</h3>
            <p className="text-xs text-slate-500">
              Broker API funding &amp; withdrawal costs
            </p>
          </div>
        </div>
        <dl>
          <FeeRow label="Domestic Wire Deposit" value={fees.alpaca.depositWireDomestic} />
          <FeeRow label="International Wire Deposit (SWIFT)" value={fees.alpaca.depositWireInternational} />
          <FeeRow label="Domestic Wire Withdrawal" value={fees.alpaca.withdrawalWireDomestic} />
          <FeeRow label="International Wire Withdrawal" value={fees.alpaca.withdrawalWireInternational} />
          <FeeRow label="Funding Wallet / Local Rail" value={fees.alpaca.fundingWalletLocalRail} />
        </dl>
        {fees.alpaca.notes && (
          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
            {fees.alpaca.notes}
          </p>
        )}
        <a
          href="https://docs.alpaca.markets/us/docs/funding-accounts"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-xs font-medium text-musaffa-700 hover:underline"
        >
          Alpaca Funding Accounts docs →
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
            B
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Local Bank Fees</h3>
            <p className="text-xs text-slate-500">
              Fees users incur via local banking partners
            </p>
          </div>
        </div>
        <dl>
          <FeeRow label="Deposit Fee" value={fees.localBank.depositFee} />
          <FeeRow label="Withdrawal Fee" value={fees.localBank.withdrawalFee} />
          <FeeRow label="FX Conversion Fee" value={fees.localBank.fxConversionFee} />
        </dl>
        {fees.localBank.notes && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            {fees.localBank.notes}
          </p>
        )}
      </div>
    </div>
  );
}
