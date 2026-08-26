# Trust boundaries

A valid Ed25519 signature authenticates the issuer-controlled bytes; it does not prove the issuer's underlying claim is true. Eligibility comes only from the registry, replay state is held by the nonce store, and policy can narrow but never override a cryptographic denial.

The optional UI is read-only. Allocation consumes only policy-allowed evidence and publishes reject counts; it cannot resurrect denied events. Transparency claims are unverifiable when signatures or registry epochs do not match.
