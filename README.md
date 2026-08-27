<div align="center">

# 🛡️ SIGNET

### Deterministic evidence verification for signed engagement, policy, and transparency claims

**Domain-separated. Replay-protected. Registry-gated. Zero runtime dependencies.**

> **Maturity: 0.x scaffold.** SIGNET is designed for auditability and independent
> reimplementation. It is not production-ready, externally audited, or a
> replacement for piproof or an external security review.

[![Node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](https://nodejs.org)
[![Runtime dependencies](https://img.shields.io/badge/runtime%20dependencies-0-success.svg)](#-design-principles)
[![Protocol](https://img.shields.io/badge/protocol-SIGNET--PEP--v1-1f6feb.svg)](#-protocol-surface)
[![License](https://img.shields.io/badge/license-see%20repository-lightgrey.svg)](#-license)

</div>

---

> [!IMPORTANT]
> SIGNET is an independent implementation. It is not an official Pi Network
> product and does not claim endorsement by Pi Network or any other ecosystem.

SIGNET provides a narrow, cryptographically verifiable foundation for signed
engagement evidence. It is an off-chain stack: it does not deploy contracts, read
chain state, or attest whether coins were mined or withdrawn from an exchange. It keeps protocol evidence separate from sector-specific
ideas: the PEP engagement body stays closed, while sector packs, receipts,
allocation, and transparency claims operate in their own planes.

## 📑 Table of Contents

- [Why SIGNET exists](#-why-signet-exists)
- [Design principles](#-design-principles)
- [Protocol surface](#-protocol-surface)
- [Verification pipeline](#-verification-pipeline)
- [Architecture](#-architecture)
- [Project map](#-project-map)
- [Usage](#-usage)
- [Testing and CI gates](#-testing-and-ci-gates)
- [Security boundaries](#-security-boundaries)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Why SIGNET exists

SIGNET turns an application event into evidence that another party can verify
without trusting the issuer's application logic. Its trust model is explicit:

| Requirement | SIGNET implementation |
|---|---|
| Stable signed bytes | Frozen NFC-aware canonicalization profile |
| Authentic issuer | Ed25519 signatures with domain separation |
| App and key control | Registry-managed apps, key validity, rotation, and revocation |
| Sybil-resistance inputs | Registry-owned KYC and Mainnet eligibility |
| Bounded influence | Utility-class ceilings and catalog action ceilings |
| Replay resistance | Atomic per-app nonce claims after every prior gate passes |
| Narrowing policy | Policy packs can deny, never rescue a cryptographic failure |
| Auditable rewards | One-time claim receipts keyed by app, evidence, and window |
| Honest transparency | Signed escrow and floor claims with epoch matching |

## ✨ Design principles

- **Closed by default:** unknown fields, unsupported specs, malformed values, and
  embedded economic fields are rejected.
- **Crypto before policy:** policy runs only after the cryptographic pipeline
  returns `ALLOW`.
- **No silent mutation:** requested weights above a ceiling return
  `ADAPTER_WEIGHT_CLAMP_DENIED`; production code never clamps them.
- **Registry over payload:** KYC and Mainnet status are read from trusted
  registry state, never self-declared event fields.
- **No chain lookup in verification:** the verifier consumes supplied registry
  state and does not fetch live chain state.
- **Separation of concerns:** pricing, GCV, QWF, TVL, and sector narratives do
  not belong inside the signed engagement event or verifier.

## 🔐 Protocol surface

### Signature domains

Every artifact signs its canonical body with a dedicated domain prefix:

| Domain | Artifact |
|---|---|
| `SIGNET-PEP-v1` | Engagement event |
| `SIGNET-KEY-v1` | Key registration, rotation, and revocation |
| `SIGNET-ESCROW-v1` | Escrow lock claim |
| `SIGNET-FLOOR-v1` | Floor claim |
| `SIGNET-ALLOC-v1` | Allocation snapshot |
| `SIGNET-RECEIPT-v1` | Reward claim receipt |

A signature from one domain must never verify under another domain.

### PEP/1 engagement event

The signed event is intentionally small and closed:

`spec`, `app_id`, `key_id`, `pioneer_uid_hash`, `action_id`, `utility_class`,
`weight`, `timestamp_ms`, `nonce`, and `signature`.

It contains no raw UID, KYC flags, prices, sector narrative, allocation
formula, or `p_floor` data. The keyed `h1:` pseudonym is derived from an
app-specific HMAC-SHA256 secret and the NFC-normalized raw identifier.

## ✅ Verification pipeline

`verifyEngagement(event, ctx)` executes these gates in exact order:

```text
1. schema and closed fields       → SCHEMA
2. application registry          → UNKNOWN_APP
3. key validity and revocation   → UNKNOWN_KEY / REVOKED_KEY
4. canonical signed bytes        → SCHEMA
5. Ed25519 signature             → INVALID_SIGNATURE
6. timestamp window              → TIMESTAMP_EXPIRED / TIMESTAMP_IN_FUTURE
7. utility-class ceiling         → WEIGHT_OVERFLOW
8. registry eligibility          → INELIGIBLE_USER
9. atomic nonce claim            → REPLAY_DETECTED
```

Steps 1–8 never consume a nonce. Only a fully valid event reaches the atomic
claim in step 9. A unified decision reports `crypto`, `policy`,
`alloc_eligible`, `code`, `pack`, `catalog_hash`, `registry_epoch`,
`evidence_id`, and `trace_id`.

## 🏗️ Architecture

```text
sector context
      │
      ▼
closed catalog + mapper ──► SIGNET-PEP-v1 body
                                  │
                                  ▼
                         canonical bytes + Ed25519
                                  │
                                  ▼
                       nine-step registry verifier
                          │                 │
                 policy packs          accepted evidence
                          │                 │
                          ▼                 ├── receipts
                       decision             ├── ALLOC snapshot
                                            └── transparency claims
```

Allocation is derived only from policy-allowed evidence. Normalization lives in
`src/alloc/snapshot.js`, not in the engagement event or verifier, and snapshots
publish rejection counts by exact code.

## 🗺️ Project map

```text
signet/
├── docs/CANONICALIZATION.md       frozen canonicalization rules
├── schema/                        closed JSON schemas
├── packs/                         catalog and sector policy packs
├── src/core/                      canonical, schema, crypto, registry, nonce, verify
├── src/keys/                      key certificate lifecycle
├── src/adapter/                   catalog loading and context mapping
├── src/policy/                    narrowing-only policy decisions
├── src/receipt/                   claim store and signed receipts
├── src/alloc/                     policy-filtered allocation snapshots
├── src/transparency/              escrow and floor claim verification
├── src/sdk/                       createSignet() integration surface
├── src/cli/                       keygen, map, sign, verify, decide, receipt, snapshot
├── scripts/                       catalog and vector freeze/check gates
├── test/                          core, key, eligibility, weight, pack, receipt, and diff tests
├── vectors/                       committed deterministic interoperability vectors
└── vendor/pep-vectors/            vendored public regression vectors
```

## 💻 Usage

Install nothing for runtime use. With Node 18 or newer:

```bash
# Map a sector context into a closed PEP body
node src/cli/cli.js map --pack retail-purchase-v1 --in context.json

# Sign and verify an event
node src/cli/cli.js sign --key key.json --in body.json
node src/cli/cli.js verify --in event.json

# Apply a named policy pack
node src/cli/cli.js decide --in event.json --pack retail-purchase-v1

# Issue a one-time reward receipt
node src/cli/cli.js receipt issue --in event.json --window 2026-W35

# Produce an allocation snapshot
node src/cli/cli.js snapshot --in accepted.json --rejects rejects.json
```

Library usage:

```js
import { createSignet } from './src/sdk/index.js'

const signet = createSignet({ registry, nonceStore, receiptStore, catalog, packs, now })
const body = await signet.map(context)
const event = await signet.sign(body, appSecretKey)
const decision = await signet.decide(event, 'retail-purchase-v1')
```

## 🧪 Testing and CI gates

```bash
npm test
npm run attacks:core
npm run catalog:check
npm run gen:vectors
npm run ci
```

The adversarial coverage targets replay and nonce reuse, forged signatures,
post-sign mutation, stale and future timestamps, weight overflow, unknown and
revoked keys, cross-app forgery, bad specs, self-declared eligibility, KYC and
Mainnet mismatch, unregistered pioneers, and policy attempts to override a
crypto denial.

Catalog and vector outputs are deterministic and committed. Any byte drift is
a release blocker unless the catalog version or intended vector contract is
changed explicitly.

## 🛡️ Security boundaries

A valid signature proves that a registered key signed a canonical claim; it does
not prove that the claim is factually true. Truth-sensitive eligibility comes
from registry state. A policy pack may narrow an accepted event but can never
turn `REPLAY_DETECTED`, `INVALID_SIGNATURE`, or any other crypto denial into an
allow.

SIGNET deliberately excludes PQC, ZK identity, cross-chain identity, monetary
multipliers, and live chain-state fetching from v1. Transparency displays use
`attested_claim` only when the signature and registry epoch match; otherwise
they report `UNVERIFIABLE` and never invent a numeric floor.

## 🧭 Roadmap

| Release | Scope | Status |
|---|---|---|
| v1.0 | Canonical core, verifier, registry, packs, receipts, transparency, allocation, SDK, CLI | Complete |
| Future | Optional second-language verifier and expanded conformance tooling | Deferred |
| Future | PQC, ZK, cross-chain identity, and economic allocation formulas | Explicitly out of scope |

## 🤝 Contributing

Keep the protocol surface narrow and auditable. New PEP fields are not accepted
in v1. Changes to canonicalization, catalog bytes, signature domains, failure
codes, or allocation eligibility require matching vectors and tests.

```bash
git checkout -b feat/your-change
npm run ci
```

## 📜 License

See the repository license file for the governing terms. SIGNET is an
independent community implementation and is not affiliated with or endorsed by
Pi Network or any other third party.

---

<div align="center">

**Built as evidence, not as advertising.**

</div>
