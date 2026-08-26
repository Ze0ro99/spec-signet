---
name: Next build workflow
description: Environment-specific guidance for validating this Next.js project.
---

Run the production Next.js build with the development preview stopped, then restart the preview afterward.

**Why:** Concurrent `next dev` and `next build` processes can write to `.next` at the same time and produce misleading missing-manifest or prerender errors even when the app code is valid.

**How to apply:** When validating a change, stop the `Start application` workflow before `pnpm exec next build`; restart it only after the build finishes.