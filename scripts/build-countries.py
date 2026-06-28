"""Process Country Eligibility List.xlsx into structured JSON for the knowledge base."""

import json
import re
import sys
from pathlib import Path

import pandas as pd

EXCEL_PATH = Path(r"c:\Users\Eugene\Downloads\Country Eligibility List.xlsx")
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "countries.json"


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def empty_kb() -> dict:
    section = {"status": "draft", "content": ""}
    return {
        "accountOpening": dict(section),
        "kyc": dict(section),
        "riskAssessment": dict(section),
        "funding": dict(section),
        "fees": dict(section),
        "withdrawals": dict(section),
        "portfolioInformation": dict(section),
        "troubleshooting": dict(section),
        "generalFaqs": dict(section),
    }


def main() -> None:
    df = pd.read_excel(EXCEL_PATH)

    prohibited = set(df["Prohibited"].dropna().str.strip())
    restricted = set(df["Restricted"].dropna().str.strip())
    high_risk = set(df["High-Risk"].dropna().str.strip())
    regulatory = set(df["Regulatory Restrictions"].dropna().str.strip())

    countries: list[dict] = []

    for _, row in df.iterrows():
        name = str(row["Country"]).strip()
        countries.append(
            {
                "code": str(row["Code"]).strip(),
                "name": name,
                "slug": slugify(name),
                "region": str(row["Region"]).strip(),
                "eligible": True,
                "alpacaRiskLevel": str(row["Alpaca Risk Level"]).strip(),
                "currency": str(row["Currency"]).strip(),
                "ineligibilityReason": None,
                "ineligibilityCategory": None,
                "managedInvesting": {
                    "enabled": True,
                    "provider": "Alpaca",
                    "notes": "Managed investing available via Alpaca Broker API.",
                },
                "userStats": {
                    "totalUsers": 0,
                    "stages": {
                        "accountOpening": 0,
                        "kyc": 0,
                        "riskAssessment": 0,
                        "funding": 0,
                        "active": 0,
                    },
                },
                "fees": {
                    "alpaca": {
                        "depositWireDomestic": "Varies — see Alpaca contract",
                        "depositWireInternational": "SWIFT wire supported; Currency Cloud conversion fees apply",
                        "withdrawalWireDomestic": "Fee per contract; user or firm may pay (fee_payment_method)",
                        "withdrawalWireInternational": "International SWIFT wire fees apply",
                        "fundingWalletLocalRail": "Supported regions only — see Alpaca Funding Wallets docs",
                        "notes": "Outgoing wires charged since June 2022. Travel Rule compliance required for all deposits.",
                    },
                    "localBank": {
                        "depositFee": "TBD — configure per country",
                        "withdrawalFee": "TBD — configure per country",
                        "fxConversionFee": "TBD — configure per country",
                        "notes": "Local bank fees vary by institution and corridor.",
                    },
                },
                "knowledgeBase": empty_kb(),
            }
        )

    all_ineligible: dict[str, str] = {}
    for name in prohibited:
        all_ineligible[name] = "prohibited"
    for name in restricted:
        all_ineligible.setdefault(name, "restricted")
    for name in high_risk:
        all_ineligible.setdefault(name, "high_risk")
    for name in regulatory:
        all_ineligible.setdefault(name, "regulatory_restrictions")

    reason_map = {
        "prohibited": "Country is on Alpaca prohibited list — services not available.",
        "restricted": "Country is restricted — limited or no service availability.",
        "high_risk": "Country classified as high-risk — enhanced due diligence required; may not be supported.",
        "regulatory_restrictions": "Country has regulatory restrictions preventing service availability.",
    }

    for name, cat in sorted(all_ineligible.items()):
        countries.append(
            {
                "code": slugify(name)[:3].upper(),
                "name": name,
                "slug": slugify(name),
                "region": "Unknown",
                "eligible": False,
                "alpacaRiskLevel": None,
                "currency": None,
                "ineligibilityReason": reason_map[cat],
                "ineligibilityCategory": cat,
                "managedInvesting": None,
                "userStats": None,
                "fees": None,
                "knowledgeBase": None,
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(countries, f, ensure_ascii=False, indent=2)

    eligible = sum(1 for c in countries if c["eligible"])
    print(f"Wrote {len(countries)} countries ({eligible} eligible) to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
