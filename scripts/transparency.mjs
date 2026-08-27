import { dashboardBytes } from '../src/transparency/dashboard.js';
import { computeFloor } from '../src/transparency/pfloor.js';
import { poolInvariant } from '../src/transparency/pool.js';
const floor = computeFloor({ R: 100n, S: 100n, Q: 1n });
const pool = poolInvariant([{ x: 10, y: 10 }, { x: 11, y: 11 }], 0.1);
const out = { floor, pool, dashboard: 'read-only' };
console.log(JSON.stringify(out, (_, v) => typeof v === 'bigint' ? v.toString() : v));
if (!dashboardBytes({ escrow: 'UNVERIFIABLE' }).length) process.exit(1);
