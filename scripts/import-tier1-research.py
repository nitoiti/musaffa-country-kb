"""
Import Tier 1 KYC & Funding research into data/countries.json.
Source: Tier 1 KYC and Funding Research for Musaffa.pdf
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "countries.json"

PUBLISHED = "published"


def kb(
    account_opening: str,
    kyc: str,
    risk: str,
    funding: str,
    fees: str,
    withdrawals: str,
    portfolio: str,
    troubleshooting: str,
    faqs: str,
) -> dict:
    section = lambda content: {"status": PUBLISHED, "content": content.strip()}
    return {
        "accountOpening": section(account_opening),
        "kyc": section(kyc),
        "riskAssessment": section(risk),
        "funding": section(funding),
        "fees": section(fees),
        "withdrawals": section(withdrawals),
        "portfolioInformation": section(portfolio),
        "troubleshooting": section(troubleshooting),
        "generalFaqs": section(faqs),
    }


TIER1_RESEARCH: dict[str, dict] = {
    "united-states-of-america": {
        "managedInvesting": {"enabled": True, "provider": "Alpaca", "notes": "U.S.-specific CIP/SSN flow required."},
        "fees": {
            "alpaca": {
                "depositWireDomestic": "No Alpaca fee on ACH; wires vary by bank",
                "depositWireInternational": "N/A for U.S. residents — use ACH",
                "withdrawalWireDomestic": "No Alpaca fee on ACH withdrawals",
                "withdrawalWireInternational": "Outgoing wire fee per Alpaca contract (~$25)",
                "fundingWalletLocalRail": "ACH via Plaid is default for U.S. residents",
                "notes": "ACH is preferred. Chase benchmark: $25 online domestic wire, $35 branch, $40–50 international outgoing; $15 incoming wire typical.",
            },
            "localBank": {
                "depositFee": "$0 on ACH",
                "withdrawalFee": "$0 on ACH",
                "fxConversionFee": "N/A — USD account",
                "notes": "Support default: ACH first, wire only when needed.",
            },
            "rates": {
                "alpacaWithdrawalWire": 25,
                "alpacaDepositWire": 0,
                "localBankDeposit": 0,
                "localBankWithdrawal": 0,
                "fxSpreadPercent": 0,
                "correspondentBankFee": 0,
                "currencyCloudConversion": 0,
            },
        },
        "knowledgeBase": kb(
            account_opening="""U.S. residents require a separate onboarding flow from international users.
Requirements: age 18+, valid SSN, legal residential address in the 50 states or Puerto Rico, U.S. citizen, permanent resident, or qualifying visa holder.
Documents: SSN plus passport or state-issued driver's license/state ID, plus U.S. residential address (no PO boxes).
Review is often fast for clean cases; manual review for SSN/name mismatches, thin-file identities, visa questions, or address discrepancies.
Common rejections: missing SSN, non-residential or PO-box address, unsupported visa status, document mismatch.""",
            kyc="""U.S. CIP rules require risk-based identity verification and screening against government lists.
Documentary and non-documentary CIP checks resolve most U.S. identities quickly.
Do not route U.S. tax residents through the non-U.S. onboarding funnel.
Recordkeeping required for five years. PEPs are not prohibited but require risk-based escalation.""",
            risk="""Low-to-medium AML risk operationally — strong identity data but unforgiving regulatory expectations.
U.S. broker-dealer CIP and sanctions screening apply. Regulatory accountability is high.""",
            funding="""ACH via Plaid-linked bank accounts is the default — no Alpaca fee on ACH deposits or withdrawals.
Wires are fallback when ACH unavailable.
Realistic $1,000 ACH deposit lands as full $1,000.
Travel Rule information-sharing applies to incoming transfers per Alpaca documentation.""",
            fees="""ACH: $0 Alpaca fee — preferred method.
Domestic wire (bank): ~$25 online (Chase benchmark), $35 in branch.
International wire outgoing: ~$40–50 from major banks.
Incoming wire: typically ~$15 unless waived by account tier.
Example: $1,000 ACH → $1,000 lands on account.""",
            withdrawals="""ACH withdrawal: no Alpaca fee, full amount to linked bank.
Wire withdrawal: Alpaca outgoing wire fee deducted if user pays (fee_payment_method: user).
Receiving bank may deduct additional fees on wire.
Example: $1,000 ACH withdrawal → $1,000 received.""",
            portfolio="""U.S. customers receive 1099 reporting from Alpaca (1099-B for sales, 1099-DIV/INT when thresholds met).
Federal and state tax rules apply to dividends and capital gains.
Shariah screening does not change U.S. tax treatment.""",
            troubleshooting="""Top support tickets: ACH-linking failures, name/SSN mismatch, deposit pending/reversed, tax-form questions, restrictions from negative balances or unsettled transfers.
Check: Plaid link status, exact name match on bank account, SSN format, address not PO box.""",
            faqs="""Q: Can I use ACH? — Yes, preferred method.
Q: Do I need SSN? — Yes for U.S. residents.
Q: Can I use a PO box? — No for residential address.
Q: Will I get tax forms? — Yes, typically 1099s for reportable activity.
Q: Are dividends halal? — Musaffa screens securities; dividend tax still follows U.S. rules.
Q: Why is my withdrawal smaller? — Wire fees and receiving-bank deductions.""",
        ),
    },
    "switzerland": {
        "fees": {
            "rates": {
                "alpacaWithdrawalWire": 50,
                "alpacaDepositWire": 0,
                "localBankDeposit": 45,
                "localBankWithdrawal": 35,
                "fxSpreadPercent": 0.012,
                "correspondentBankFee": 20,
                "currencyCloudConversion": 0,
            },
        },
        "knowledgeBase": kb(
            account_opening="""Passport is default primary document; Swiss residence permit accepted where KYC supports it.
Main issue: accented characters and local-script addresses need ASCII transliteration for Alpaca.
Proof of address: recent bank statement, commune/canton correspondence, tax correspondence, or utility bill.
Common rejections: transliteration mismatch, stale proof of address, funding bank not matching applicant.""",
            kyc="""FINMA AML materials emphasize care for PEPs and high-risk jurisdiction links.
Cross-border service documentation must be tight. Standard passport + address + selfie flow.""",
            risk="""Medium regulatory risk — FinSA/FINMA cross-border expectations, not a bar on U.S. equities.
PEPs require EDD. Switzerland is not EU but has strong AML standards.""",
            funding="""CHF supported for SWIFT deposits; Switzerland in Funding Wallet deposit coverage.
Local-rail deposits not listed — wire-first market.
UBS benchmark: OUR option adds CHF 20; incoming foreign payments CHF 66 under SHA/BEN.
$1,000 equivalent often lands ~$955–$985 after Swiss bank fees and FX.""",
            fees="""Swiss bank outgoing: variable; UBS foreign payment surcharges apply.
FX: bank surcharge on CHF→USD conversion.
Intermediary/correspondent fees common on SWIFT.
Support estimate: 1.5–4.5% total leakage on wire funding.""",
            withdrawals="""SWIFT withdrawal in CHF or USD. Alpaca wire fee applies ($50 intl benchmark).
Receiving Swiss bank may deduct fees. FX spread on USD→CHF.""",
            portfolio="""Swiss residents taxed on worldwide income/wealth. Dividends at ordinary rates.
Private movable-asset capital gains often exempt (professional trader distinction applies).
W-8BEN: U.S.–Switzerland treaty generally reduces dividend withholding to 15%.""",
            troubleshooting="""Common: transliteration rejects, Swiss bank fee surprises, PEP/source-of-wealth review delays.
Verify ASCII formatting on all Alpaca fields before escalation.""",
            faqs="""Q: Can I fund in CHF? — Yes, typically SWIFT.
Q: Will Musaffa market in Switzerland? — Yes, Open internally.
Q: U.S. dividends taxed twice? — U.S. withholding first; Swiss reporting still applies.
Q: Capital gains in Switzerland? — Often exempt for private investors; circumstances vary.""",
        ),
    },
    "ireland": {
        "fees": {"rates": {"alpacaWithdrawalWire": 50, "alpacaDepositWire": 0, "localBankDeposit": 15, "localBankWithdrawal": 22, "fxSpreadPercent": 0.008, "correspondentBankFee": 15, "currencyCloudConversion": 0}},
        "knowledgeBase": kb(
            account_opening="""Passport is least problematic primary document. Proof of address plus tax identifier where applicable.
Failures: transliteration, Irish name/address mismatch, non-Irish source accounts funding immediately after approval.
Address must be recent and match application exactly.""",
            kyc="""Standard EU MiFID/AML. EDD for PEPs. Reverse-solicitation discipline — no active promotion (Conditional marketing).""",
            risk="""Medium — EU retail perimeter. Key issue is marketing controls, not whether Irish residents may hold foreign equities.""",
            funding="""EUR local-rail deposits and withdrawals supported — one of best Tier 1 funding jurisdictions.
AIB benchmark: non-urgent SEPA outgoing €15, urgent €22.50, incoming intl €6.35+.
€1,000 deposit → ~$960–$985 lands after bank fee, FX, intermediaries.""",
            fees="""AIB: €15 electronic / €22.50 urgent outgoing. Incoming intl from €6.35.
FX variable, bank-set. Local rails preferred over SWIFT.""",
            withdrawals="""EUR local-rail withdrawal supported. Bank + FX fees apply. Alpaca wire fee if Musaffa/user pays.""",
            portfolio="""W-8BEN → 15% U.S.–Ireland treaty dividend rate. Irish tax on worldwide income; CGT on worldwide gains for resident individuals.""",
            troubleshooting="""Deposit sent in EUR not credited, wrong beneficiary details, treaty withholding confusion, KYC pending, landed amount less than sent.""",
            faqs="""Q: Can I send EUR locally? — Yes.
Q: Converted to USD? — Yes.
Q: Report U.S. dividends in Ireland? — Yes, Irish tax may apply.
Q: U.S. withholding? — Generally 15% with valid W-8BEN.""",
        ),
    },
    "france": {
        "fees": {"rates": {"alpacaWithdrawalWire": 50, "alpacaDepositWire": 0, "localBankDeposit": 15, "localBankWithdrawal": 15, "fxSpreadPercent": 0.007, "correspondentBankFee": 15, "currencyCloudConversion": 0}},
        "knowledgeBase": kb(
            account_opening="""Passport robust; French national ID where vendor supports. Safest: passport first.
Issues: diacritics, compound surnames, address formatting, truncated POA uploads.
Expect questions about local regulation vs cross-border access.""",
            kyc="""EU AML/MiFID. AMF vocal on cross-border retail conduct. Medium regulatory risk, moderate onboarding friction.""",
            risk="""Conditional marketing — no active promotion. PEP/sanctions EDD standard.""",
            funding="""EUR local-rail deposits and withdrawals supported.
BNP Paribas: no issuance commission if beneficiary currency + full details; else €15 + correspondent fees.
€1,000 → ~$965–$990 landed on clean route.""",
            fees="""BNP: €0–€15 outgoing depending on currency/details. Correspondent fees possible.
FX spread applies on EUR→USD.""",
            withdrawals="""EUR local-rail payout supported. Processing + FX deductions.""",
            portfolio="""French worldwide income taxation. Flat-tax regime on investment income (~30% + surtaxes for some).
W-8BEN → 15% U.S. dividend withholding with treaty.""",
            troubleshooting="""Missing sender-name match, compliance screening, incomplete beneficiary details, diacritic rejects.""",
            faqs="""Q: Send euros locally? — Yes.
Q: Taxed again in France? — French reporting separate from U.S. withholding.
Q: Musaffa advertise in France? — No, Conditional internally.""",
        ),
    },
    "germany": {
        "fees": {"rates": {"alpacaWithdrawalWire": 50, "alpacaDepositWire": 0, "localBankDeposit": 12, "localBankWithdrawal": 36, "fxSpreadPercent": 0.008, "correspondentBankFee": 25, "currencyCloudConversion": 0}},
        "knowledgeBase": kb(
            account_opening="""Passport first, residence/address proof second.
False rejects: umlauts/ß transliteration, address truncation, bank holder name mismatch.
Delay if funding immediately from foreign IBAN outside customer's name.""",
            kyc="""BaFin cross-border guidance: active acquisition may trigger licensing. Medium regulatory risk. PEP EDD standard.""",
            risk="""Conditional marketing. Careful public acquisition. Not light-touch from licensing lens.""",
            funding="""EUR local rails supported — default route.
Deutsche Bank SWIFT benchmark: OUR ≥€10 + €1.55 SWIFT + €25 foreign-bank charge before FX.
Local rail $1,000 equiv → ~$970–$990; SWIFT path worse.""",
            fees="""Local rails default. SWIFT expensive (€36+ all-in benchmark before FX).
German banks often require payment purpose field.""",
            withdrawals="""EUR local-rail withdrawal. Bank FX + fees apply.""",
            portfolio="""~25% + solidarity surcharge on investment gains (headline). W-8BEN → 15% U.S. dividend withholding.""",
            troubleshooting="""ASCII/transliteration mismatch, payment purpose field missing, foreign IBAN funding delays.""",
            faqs="""Q: Fund in EUR without SWIFT? — Yes, local rails supported.
Q: German tax too? — Yes, local reporting is customer's responsibility.
Q: Musaffa advertise in Germany? — Conditional only.""",
        ),
    },
    "netherlands": {
        "fees": {"rates": {"alpacaWithdrawalWire": 50, "alpacaDepositWire": 0, "localBankDeposit": 10, "localBankWithdrawal": 12, "fxSpreadPercent": 0.0085, "correspondentBankFee": 10, "currencyCloudConversion": 0}},
        "knowledgeBase": kb(
            account_opening="""Passport-first; Dutch ID where supported. Strict transliteration and address normalization.
Mailing vs residential address on POA is common failure. Digital-first bank users expect low-cost EUR transfers.""",
            kyc="""AFM: third-country firms active only under specified conditions. Conditional marketing, careful legal perimeter.""",
            risk="""Medium regulatory risk. Not an inherent onboarding block.""",
            funding="""EUR local-rail both directions — model EU implementation.
ING: 0.85% FX mark-up on 19 currencies for intl transfers.
$1,000 via local rails → ~$980–$992; SWIFT path lower.""",
            fees="""ING 0.85% FX mark-up benchmark. OUR surcharges vary by corridor. Local rails preferred.""",
            withdrawals="""EUR local-rail withdrawal. FX + local bank charges.""",
            portfolio="""Dutch box system for tax. W-8BEN → 15% U.S. dividend withholding.""",
            troubleshooting="""'Free transfer' confusion — EUR→USD conversion still reduces landed amount. Joint account ownership checks.""",
            faqs="""Q: Send EUR locally? — Yes.
Q: Why not full $1,000? — EUR→USD conversion applies.
Q: Musaffa market openly? — No, Conditional internally.""",
        ),
    },
    "belgium": {
        "fees": {"rates": {"alpacaWithdrawalWire": 50, "alpacaDepositWire": 0, "localBankDeposit": 15, "localBankWithdrawal": 15, "fxSpreadPercent": 0.008, "correspondentBankFee": 15, "currencyCloudConversion": 0}},
        "knowledgeBase": kb(
            account_opening="""Passport safest; Belgian ID where supported. Multilingual addresses, accented names, stale POA common friction.""",
            kyc="""EU AML patterns. FSMA active on conduct supervision. Medium regulatory risk.""",
            risk="""Conditional marketing. Update support macros for 2026 tax reform.""",
            funding="""EUR local rails both directions.
BNP Paribas Fortis: free if beneficiary currency + details; else €3–€15. KBC: processing fee + exchange-rate difference.
$1,000 → ~$970–$992 via clean EUR funding.""",
            fees="""€0–€15 outgoing depending on route. FX always matters — never promise 'free' funding.""",
            withdrawals="""EUR payout via local rails. Belgian bank screening delays possible.""",
            portfolio="""⚠️ 2026 capital-gains tax on financial assets: 10% rate from 1 Jan 2026, annual exemption on first tranche.
W-8BEN → 15% U.S. dividend withholding.""",
            troubleshooting="""Beneficiary field mismatch, Belgian bank screening, outdated tax disclaimers in macros.""",
            faqs="""Q: Belgians owe tax on stock gains? — Yes under 2026 regime (subject to exemptions).
Q: Fund in EUR locally? — Yes.
Q: Musaffa advertise in Belgium? — No, Conditional internally.""",
        ),
    },
    "sweden": {
        "fees": {"rates": {"alpacaWithdrawalWire": 50, "alpacaDepositWire": 0, "localBankDeposit": 6, "localBankWithdrawal": 25, "fxSpreadPercent": 0.008, "correspondentBankFee": 25, "currencyCloudConversion": 0}},
        "knowledgeBase": kb(
            account_opening="""Passport safest; Swedish national ID where supported. Transliteration and address normalization main issues.
BankID not supported by Musaffa — document + selfie verification applies.""",
            kyc="""EU Conditional marketing. PEP/sanctions EDD standard.""",
            risk="""Normal EU retail-equities perspective. Conditional marketing applies.""",
            funding="""SEK/EUR local-rail deposits and withdrawals supported.
Nordea benchmark: online intl payment 60 SEK, branch 300 SEK, beneficiary abroad 250 SEK.
$1,000 local rails → ~$975–$990.""",
            fees="""Nordea: 60 SEK online intl vs cheaper local-rail routes. Script difference for support.""",
            withdrawals="""Local-rail EUR/SEK payout. Avoid expensive 'international payment' when local rail available.""",
            portfolio="""30% flat rate on investment income and capital gains (PwC). W-8BEN → 15% U.S. dividend withholding.""",
            troubleshooting="""User chose expensive international payment instead of local rail. BankID expectation management.""",
            faqs="""Q: Fund from SEK account? — Yes.
Q: Swedish tax too? — Yes, local reporting applies.
Q: Musaffa advertise openly? — No, Conditional internally.""",
        ),
    },
    "singapore": {
        "fees": {"rates": {"alpacaWithdrawalWire": 50, "alpacaDepositWire": 0, "localBankDeposit": 5, "localBankWithdrawal": 5, "fxSpreadPercent": 0.005, "correspondentBankFee": 15, "currencyCloudConversion": 0}},
        "knowledgeBase": kb(
            account_opening="""Passport safest. High digital onboarding expectations — failures feel surprising.
Causes: address mismatch, unsupported POA formats, source-of-funds on layered payment accounts.
MAS AML scrutiny increased from July 2025 — more SOW questions on higher-value cases.""",
            kyc="""MAS licensing perimeter for capital-markets products. Cross-border exemptions structured. Conditional marketing only.""",
            risk="""Medium regulatory risk. Not open marketing despite onboarding being possible.""",
            funding="""SGD SWIFT deposits supported; local-rail deposits NOT listed for Singapore.
Local-rail withdrawals ARE listed.
DBS Remit: zero fee USD to USA on eligible corridors; agent-bank charges may apply.
$1,000 → ~$975–$995 on competitive remit corridor.""",
            fees="""Corridor-dependent — DBS Remit can be cheap; telegraphic transfer paths worse.
No local-rail deposit — wire/FX-driven funding.""",
            withdrawals="""Local-rail withdrawal supported for Singapore. SGD payout possible.""",
            portfolio="""⚠️ No U.S.–Singapore dividend treaty in IRS tables used — expect 30% U.S. withholding default.
Foreign-sourced dividends generally not taxable locally; no CGT absent trading/business characterization.""",
            troubleshooting="""AML/source-of-wealth questions, 30% withholding confusion, remit vs TT path selection.""",
            faqs="""Q: Fund with SGD? — Yes, usually wire + conversion.
Q: Withdraw locally? — Local-rail withdrawals listed.
Q: Why 30% U.S. withholding? — No treaty reduction in conservative view.
Q: Musaffa market openly? — No, Conditional internally.""",
        ),
    },
}


def merge_fees(existing: dict | None, update: dict) -> dict:
    if not existing:
        return update
    merged = {**existing}
    if "rates" in update:
        merged["rates"] = update["rates"]
    if "alpaca" in update:
        merged["alpaca"] = {**merged.get("alpaca", {}), **update.get("alpaca", {})}
    if "localBank" in update:
        merged["localBank"] = {**merged.get("localBank", {}), **update.get("localBank", {})}
    return merged


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = 0

    for country in data:
        slug = country["slug"]
        if slug not in TIER1_RESEARCH:
            continue

        research = TIER1_RESEARCH[slug]
        if not country.get("eligible"):
            print(f"  skip ineligible: {country['name']}")
            continue

        if "knowledgeBase" in research:
            country["knowledgeBase"] = research["knowledgeBase"]

        if "fees" in research:
            country["fees"] = merge_fees(country.get("fees"), research["fees"])

        if "managedInvesting" in research:
            country["managedInvesting"] = research["managedInvesting"]

        updated += 1
        print(f"  updated: {country['name']}")

    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone — {updated} Tier 1 countries updated.")


if __name__ == "__main__":
    main()
