# Musaffa Country Research Prompt (for ChatGPT)

Copy everything below the line into ChatGPT.

---

You are a regulatory and fintech research analyst helping **Musaffa**, a Shariah-compliant managed investing platform. Musaffa uses **Alpaca Broker API** for US equities execution and custody. Users fund via international wires, Funding Wallets, and local banking partners (varies by country).

Prepare a **detailed country research report** for each country listed below. This will populate an internal KYC & Funding knowledge base used by support, compliance, and product teams.

## Priority countries by tier (research in this order)

**Tier 1 — highest priority (complete these first)**
1. Switzerland
2. United States
3. France
4. United Kingdom
5. Ireland
6. Singapore
7. Germany
8. Netherlands
9. Sweden
10. Belgium

**Tier 3**
Canada, Australia, United Arab Emirates, Qatar, Saudi Arabia, Bahrain

**Tier 4**
Oman, Japan

**Tier 5**
Kuwait, Malaysia

**Tier 6**
Thailand, Morocco, Türkiye, Indonesia, Jordan, Uzbekistan, Egypt, India, Pakistan, Bangladesh

Focus research effort on **Tier 1 eligible countries first** (Alpaca allows onboarding). Note tier in each country report header.

## For each country, provide these sections

### 1. Executive summary (3–5 sentences)
- Can Musaffa onboard users from this country today?
- Alpaca eligibility considerations (prohibited / restricted / high-risk / regulatory)
- Musaffa marketing status: **Open** (full promotion), **Conditional** (no promotion; popup confirmation if user finds us), or **Blocked** (no onboarding)
- One-line recommendation for Musaffa product/compliance

### 2. Account opening
- Required documents (ID types accepted: passport, national ID, residence permit, etc.)
- Minimum age, residency requirements
- Typical review timeline
- Common rejection reasons
- Musaffa-specific considerations

### 3. KYC / identity verification
- Standard KYC flow expectations
- Enhanced due diligence triggers (PEP, high-risk jurisdiction, source of wealth)
- Acceptable proof of address documents
- Known issues with automated verification for this country
- Sanctions / AML watchlist considerations

### 4. Risk assessment
- Alpaca risk tier if known (low / medium / high)
- Local regulatory classification
- Shariah / Islamic finance regulatory context if relevant
- Politically exposed persons (PEP) rules

### 5. Funding (deposits)
- How users typically fund a USD brokerage account from this country
- International SWIFT wire: process, timeline, typical costs
- Local rail / Funding Wallet availability (reference Alpaca Funding Wallets docs if applicable)
- Currency: local currency → USD conversion (typical FX spread, bank fees)
- Travel Rule / source-of-funds requirements
- Minimum deposit amounts users expect
- Common deposit failures and how to resolve

### 6. Fees (user-facing)
Provide **estimated numeric ranges in USD** where possible:
- Local bank outgoing wire fee (deposit)
- SWIFT correspondent / intermediary fees
- FX conversion spread (%)
- Alpaca incoming wire fees (if any)
- Currency Cloud conversion fees (if applicable)
- Example: user sends $1,000 — how much lands on account? (user pays fees vs Musaffa pays fees scenarios)

### 7. Withdrawals
- International wire withdrawal process and timeline
- Alpaca outgoing wire fee (typical: ~$25–50 for international)
- Local bank receiving fees
- FX on withdrawal (USD → local currency)
- Example: user withdraws $1,000 — net received in local currency
- Common withdrawal failures

### 8. Portfolio information
- Tax reporting obligations for local residents investing in US equities
- W-8BEN / FATCA / CRS implications
- Dividend withholding tax (US 30% default, treaty rates if applicable)
- Capital gains tax treatment locally
- Any reporting Musaffa should warn users about

### 9. Troubleshooting
- Top 10 support tickets we'd expect for this country
- Deposit stuck / not credited — diagnosis steps
- KYC pending too long — escalation path
- Wire rejected — common causes (missing FFC reference, Travel Rule, incorrect SWIFT)
- Account restricted — what to check

### 10. General FAQs
- 10–15 FAQ pairs specific to this country
- Include questions about Shariah compliance, halal investing, and local bank compatibility

## Musaffa-specific context to apply

**Marketing access rules (Musaffa internal — do not contradict):**
- **Conditional (popup, no promotion):** All 27 EU member states, Kuwait, Singapore, Malaysia, UAE
- **Marketing blocked (hard block):** Australia, UK, India, Saudi Arabia
- **Open:** All other Alpaca-eligible countries

**Alpaca funding references:**
- Funding Accounts: https://docs.alpaca.markets/us/docs/funding-accounts
- Funding Wallets: https://docs.alpaca.markets/us/docs/funding-wallets
- Outgoing wire fees charged since June 2022; `fee_payment_method` = `user` (deducted from amount) or `invoice` (Musaffa pays)
- Travel Rule compliance required on all incoming deposits

**Output format requirements:**
- Use markdown with clear H2/H3 headings per country
- Include a comparison table at the end ranking countries by: ease of onboarding, funding friction, withdrawal friction, regulatory risk
- Flag any information you're uncertain about with ⚠️ and suggest verification sources
- Cite official sources (regulators, Alpaca docs, major banks) where possible
- Keep language practical for support agents, not academic
- Note last-known regulatory changes (2024–2026) where relevant

Begin with Tier 1 countries. Ask me if you need clarification before starting.
