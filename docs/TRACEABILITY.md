# Traceability

| ID | Requirement | Code | Test |
|---|---|---|---|
| SIG-001 | Frozen nine-step verification | `src/core/verify.js` | `test/core/attacks.test.js` |
| SIG-002 | Domain-separated signatures | `src/core/canonical.js` | `test/core/attacks.test.js` |
| SIG-003 | Key registration and revocation | `src/core/registry.js` | `test/keys/` |
| SIG-004 | Registry eligibility | `src/core/registry.js` | `test/eligibility/` |
| SIG-005 | Class ceilings | `src/core/verify.js` | `test/weights/` |
| SIG-006 | Allocation normalization | `src/alloc/snapshot.js` | `test/weights/` |
| SIG-007 | Closed catalog | `src/adapter/` | `test/diff/` |
| SIG-008 | Sector packs | `packs/` | `test/packs/` |
| SIG-009 | Policy cannot override crypto | `src/policy/decide.js` | `test/packs/` |
| SIG-010 | One-time receipts | `src/receipt/` | `test/receipts/` |
| SIG-011 | Transparency claims | `src/transparency/` | `test/transparency/` |
| SIG-012 | Negation ledger | `src/alloc/snapshot.js` | `test/transparency/` |
| SIG-013 | No pricing in PEP | `schema/` | `test/weights/` |
| SIG-014 | Vendor vector regression | `vendor/pep-vectors/` | `test/diff/` |
