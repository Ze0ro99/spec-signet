import fs from 'node:fs';
import path from 'node:path';
const allowed = new Set(['pack','issuer_allowlist','action_classes','action_ids','min_weight','max_weight','max_age_ms','require_kyc','require_mainnet','require_epoch_bound']);
export function loadPack(file) { const value = JSON.parse(fs.readFileSync(file, 'utf8')); if (Object.keys(value).some(k => !allowed.has(k))) throw new Error('POLICY_SCHEMA'); return value; }
export function loadPacks(dir = path.resolve('packs')) { const names = ['retail-purchase-v1','gaming-achievement-v1','service-fulfillment-v1','reward-claim-v1','governance-signal-v1','agent-action-v1']; return Object.fromEntries(names.map(n => { const sector = ({'service-fulfillment-v1':'services','reward-claim-v1':'reward','governance-signal-v1':'governance','agent-action-v1':'agent','gaming-achievement-v1':'gaming','retail-purchase-v1':'retail'})[n]; return [n, loadPack(path.join(dir, sector, `${n}.json`))]; })); }
