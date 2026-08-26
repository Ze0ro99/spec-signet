# SIGNET maturity

SIGNET remains a `0.x` independent implementation. It is not externally audited and must not be described as v1 complete or superior to piproof until the complete superiority matrix is green.

| Gate | Evidence | Status |
|---|---|---|
| SUP-000–007 core scaffold gates | `npm test`, catalog/layer checks | partial |
| SUP-100 conformance kit | `npm run conformance` | foundational |
| SUP-101/102 independent implementations | `sdk/python`, `sdk/go` | parser stubs; not complete |
| SUP-103 canonical differential | canonical tests and vectors | partial |
| SUP-104 nonce races | nonce tests | partial |
| SUP-105 fuzz | `npm run fuzz` | foundational |
| SUP-106 formal model | `formal/signet_gates.tla` | model present; pinned checker pending |
| SUP-200–206 sealed architecture | domain, packs, receipts, alloc, transparency tests | partial |
| SUP-300–302 reviewability | traceability and layer gate | partial |
| External review | independent audit | pending |

A stranger can inspect and run the listed commands; green commands do not imply that incomplete evidence rows are complete.
