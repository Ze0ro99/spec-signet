 v0/ze0ro99-a8e6e867
import { dashboardBytes } from '../src/transparency/dashboard.js';
import { computeFloor } from '../src/transparency/pfloor.js';
import { poolInvariant } from '../src/transparency/pool.js';
const floor = computeFloor({ R: 100n, S: 100n, Q: 1n });
const pool = poolInvariant([{ x: 10, y: 10 }, { x: 11, y: 11 }], 0.1);
const out = { floor, pool, dashboard: 'read-only' };
console.log(JSON.stringify(out, (_, v) => typeof v === 'bigint' ? v.toString() : v));
if (!dashboardBytes({ escrow: 'UNVERIFIABLE' }).length) process.exit(1);

import { mkdir, writeFile } from 'node:fs/promises';
import { keyFingerprint, createEscrowAttestation, verifyEscrowAttestation } from '../src/transparency/escrow.js';
import { createPFloorReport, verifyPFloorReport } from '../src/transparency/pfloor.js';
import { createPoolHealthReport, verifyPoolHealthReport } from '../src/transparency/pool.js';
import { scoreEngagement } from '../src/transparency/engagement.js';
import { buildDashboardSnapshot, verifyDashboardSnapshot } from '../src/transparency/dashboard.js';
import { snapshot } from '../src/alloc/snapshot.js';
import { generateKeyPair } from '../src/core/keys-crypto.js';
import { InMemoryNonceStore } from '../src/core/nonces.js';

const now = 1764000000000;
const issuer = generateKeyPair();
const appKey = generateKeyPair();
const epoch = 'epoch-1';
const appUid = 'h1:dGVzdC1wcm9vZg==';

const escrowClaim = createEscrowAttestation({
  status: 'SIGNING_AUTHORITY_REVOKED',
  escrow_id: 'launchpad.escrow.main',
  key_id: 'escrow-k1',
  key_fingerprint: keyFingerprint(appKey.publicKey),
  revoked_at_ms: now - 1000,
  as_of_ms: now,
  registry_epoch: epoch,
  nonce: 'escrow-fixture-0001',
  anchor: null,
  issuer: 'launchpad',
}, appKey.privateKey);
const escrow = await verifyEscrowAttestation(escrowClaim, {
  publicKey: appKey.publicKey,
  epoch,
  nowMs: now,
  maxAgeMs: 300000,
  nonceStore: new InMemoryNonceStore(),
  expectedFingerprint: keyFingerprint(appKey.publicKey),
});

const floorClaim = createPFloorReport({
  R: 100,
  S: 100,
  Q: 1,
  registry_epoch: epoch,
  issued_at_ms: now,
  issuer: 'launchpad',
  nonce: 'floor-fixture-0001',
}, issuer.privateKey);
const pfloor = verifyPFloorReport(floorClaim, issuer.publicKey, epoch);

const poolClaim = createPoolHealthReport({
  samples: [
    { t: now - 86400000, x: 100, y: 100 },
    { t: now, x: 90, y: 100 },
  ],
  tau_bps: 50,
  registry_epoch: epoch,
  issued_at_ms: now,
  issuer: 'launchpad',
  nonce: 'pool-fixture-0001',
}, issuer.privateKey);
const pool = verifyPoolHealthReport(poolClaim, issuer.publicKey, epoch);

const engagement = scoreEngagement([
  { app_id: 'app.marketplace', action_id: 'retail.order_delivered', utility_class: 'A', weight: 2, timestamp_ms: now - 86400000, policy: 'ALLOW' },
  { app_id: 'app.marketplace', action_id: 'retail.order_delivered', utility_class: 'A', weight: 2, timestamp_ms: now, policy: 'ALLOW' },
  { app_id: 'app.marketplace', action_id: 'retail.order_delivered', utility_class: 'A', weight: 50, timestamp_ms: now, policy: 'DENY' },
], {
  windowStartMs: now - 2 * 86400000,
  windowEndMs: now + 1,
});

const accepted = [
  { app_id: 'app.marketplace', pioneer_uid_hash: appUid, action_id: 'retail.order_delivered', utility_class: 'A', weight: 2, policy: 'ALLOW', alloc_eligible: true },
];
const alloc = snapshot(accepted, { REPLAY_DETECTED: 1 }, epoch, null, now);
const dashboard = buildDashboardSnapshot({
  registry_epoch: epoch,
  issued_at_ms: now,
  escrow,
  pfloor,
  pool,
  engagement,
  alloc,
  raw_reserves: ['R', 'S', 'Q'],
}, issuer.privateKey);

if (!verifyDashboardSnapshot(dashboard, issuer.publicKey)) throw Error('dashboard signature failed');
await mkdir(new URL('../results/', import.meta.url), { recursive: true });
await writeFile(new URL('../results/transparency.json', import.meta.url), `${JSON.stringify(dashboard, null, 2)}\n`);
console.log(JSON.stringify({
  escrow: escrow.code,
  pfloor: pfloor.code,
  pool: pool.code,
  engagement: engagement.accepted_events,
  allocations: alloc.allocations.length,
  dashboard: dashboard.spec,
  output: 'results/transparency.json',
}));
 main
