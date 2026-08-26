# Security model

A valid signature authenticates the issuer, not the truth of a claim. Issuers are bounded by catalog and class ceilings; eligibility is read only from the registry. Revocation is checked at event time, cross-app keys are scoped, replay claims are atomic, and receipt storage cannot turn a denied event into `ALLOW`. The verifier never fetches chain state and policy cannot override crypto denial.

SIGNET 0.x is not externally audited. Do not put raw identifiers, KYC flags, pricing, floors, or sector narrative in a PEP body. Report suspected vulnerabilities privately and include a reproducible test case where possible.
