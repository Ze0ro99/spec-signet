# Nicolas traceability

| ID | Artifact | Test/command | Status |
|---|---|---|---|
| N-01 | `src/adapter/map.js` | `npm run demo` | PASS |
| N-02/N-03 | `src/keys/certs.js` | `node --test test/keys` | PASS |
| N-04 | `src/core/registry.js` | `node --test test/eligibility` | PASS |
| N-05 | `docs/CANONICALIZATION.md` | `npm run conformance` | PASS |
| N-06/N-07 | `src/core/verify.js`, `src/alloc/snapshot.js` | `npm test` | PASS |
| N-08 | `src/transparency/dashboard.js` | `npm run transparency` | PASS |
| N-09 | `src/transparency/claims.js` | `node --test test/transparency` | PASS |
| N-10 | `src/transparency/pfloor.js` | `node --test test/transparency` | PASS |
| N-11 | `test/diff/domain-pairs.test.js` | `npm run test:diff` | PASS |

This table is intentionally limited to executable paths present in the repository.
