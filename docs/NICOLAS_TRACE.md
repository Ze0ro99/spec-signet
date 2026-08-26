# Nicolas traceability

| Review point | SIGNET artifact | Test/command |
|---|---|---|
| Fine-grained engagement | closed PEP event and catalog | `npm run conformance` |
| App-specific keys | `SIGNET-KEY-v1` certificates | `test/core/attacks.test.js` |
| KYC and Mainnet | registry-only eligibility | `test/core/attacks.test.js` |
| Frozen canonical rules | canonical profile | `npm run fuzz` |
| Weight bounding | class ceilings | `npm run attacks:core` |
| Transparency | escrow/floor domains | transparency tests |
