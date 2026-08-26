# SIGNET conformance

Implementations must consume `docs/SPEC.md` and committed vectors without importing SIGNET source. Run `npm run conformance`; every vector must parse and canonicalization must remain deterministic. A mismatch is `UNVERIFIABLE`, never an implicit allow.
