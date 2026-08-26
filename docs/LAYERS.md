# SIGNET layer law

`src/core` contains protocol primitives and may not import adapter, policy, allocation, or app code. Policy may not import allocation or UI. The optional UI may consume SDK decisions but may not independently create an `ALLOW` result. `npm run check-layers` enforces the core import boundary.
