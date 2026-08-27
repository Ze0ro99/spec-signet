import { DOMAINS } from '../core/canonical.js';
import { sign, verifySignature } from '../core/keys-crypto.js';

const integer = (value) => (typeof value === 'bigint'
  ? value >= 0n
  : typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? BigInt(value)
    : typeof value === 'string' && /^\d+$/.test(value) ? BigInt(value) : null);

export function computePoolHealth(samples, { tauBps = 50 } = {}) {
  if (!Array.isArray(samples) || !Number.isSafeInteger(tauBps) || tauBps < 0 || tauBps > 10000) {
    return { code: 'UNVERIFIABLE', samples: [] };
  }
  let previous = null;
  const health = samples.map((sample) => {
    const x = integer(sample.x ?? sample.R);
    const y = integer(sample.y ?? sample.S);
    const t = integer(sample.t);
    if (x === null || y === null || t === null) return { t: sample.t, code: 'UNVERIFIABLE' };
    const k = x * y;
    let code = 'K_OK';
    if (previous !== null && k * 10000n < previous * BigInt(10000 - tauBps)) code = 'K_DROP';
    else if (previous !== null && k > previous) code = 'K_UP';
    previous = k;
    return { t: t.toString(), x: x.toString(), y: y.toString(), k: k.toString(), code };
  });
  return { code: health.some((sample) => sample.code === 'UNVERIFIABLE') ? 'UNVERIFIABLE' : 'OK', health };
}

export function createPoolHealthReport({ samples, tau_bps = 50, registry_epoch, issued_at_ms, issuer, nonce }, privateKey) {
  const calculated = computePoolHealth(samples, { tauBps: tau_bps });
  if (calculated.code !== 'OK') throw Error('POOL_INPUT');
  const body = {
    spec: 'SIGNET-POOL-v1',
    registry_epoch,
    tau_bps,
    samples: calculated.health,
    issued_at_ms,
    issuer,
    nonce,
  };
  return { ...body, signature: sign(body, privateKey, DOMAINS.POOL) };
}

export function verifyPoolHealthReport(report, publicKey, epoch) {
  if (!report || report.spec !== 'SIGNET-POOL-v1' || report.registry_epoch !== epoch || !report.signature) {
    return { status: 'UNVERIFIABLE', code: 'UNVERIFIABLE' };
  }
  const { signature, ...body } = report;
  const expected = computePoolHealth(report.samples, { tauBps: report.tau_bps });
  if (expected.code !== 'OK'
    || JSON.stringify(expected.health) !== JSON.stringify(report.samples)
    || !verifySignature(body, signature, publicKey, DOMAINS.POOL)) {
    return { status: 'UNVERIFIABLE', code: 'UNVERIFIABLE' };
  }
  const last = report.samples.at(-1);
  return { status: 'ATTESTED', code: last.code, k: last.k, report };
}