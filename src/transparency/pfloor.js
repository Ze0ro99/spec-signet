import { DOMAINS } from '../core/canonical.js';
import { sign, verifySignature } from '../core/keys-crypto.js';

const integer = (value) => {
  if (typeof value === 'bigint') return value >= 0n ? value : null;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  return null;
};

function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

export function computePFloor({ R, S, Q }) {
  const reserve = integer(R);
  const supply = integer(S);
  const quote = integer(Q);
  if (reserve === null || supply === null || quote === null) {
    return { code: 'FLOOR_INPUT', numerator: null, denominator: null };
  }
  const total = reserve + supply;
  if (total === 0n) return { code: 'FLOOR_UNDEFINED', numerator: null, denominator: null };
  const numerator = reserve * quote;
  const denominator = total * total;
  const divisor = gcd(numerator, denominator);
  return {
    code: 'OK',
    numerator: (numerator / divisor).toString(),
    denominator: (denominator / divisor).toString(),
    method_id: 'circulating-v1',
  };
}

export function createPFloorReport(
  { R, S, Q, registry_epoch, issued_at_ms, issuer, nonce, method_id = 'circulating-v1' },
  privateKey,
) {
  const result = computePFloor({ R, S, Q });
  if (result.code !== 'OK') throw Error(result.code);
  const body = {
    spec: 'SIGNET-FLOOR-v1',
    registry_epoch,
    method_id,
    R: integer(R).toString(),
    S: integer(S).toString(),
    Q: integer(Q).toString(),
    numerator: result.numerator,
    denominator: result.denominator,
    issued_at_ms,
    issuer,
    nonce,
  };
  return { ...body, signature: sign(body, privateKey, DOMAINS.FLOOR) };
}

export function verifyPFloorReport(report, publicKey, epoch) {
  const fields = ['spec', 'registry_epoch', 'method_id', 'R', 'S', 'Q', 'numerator', 'denominator', 'issued_at_ms', 'issuer', 'nonce', 'signature'];
  if (!report || Object.keys(report).some((field) => !fields.includes(field))
    || fields.some((field) => !(field in report))
    || report.spec !== 'SIGNET-FLOOR-v1'
    || report.registry_epoch !== epoch
    || report.method_id !== 'circulating-v1') return { status: 'UNVERIFIABLE', code: 'FLOOR_DOMAIN' };
  const expected = computePFloor(report);
  const { signature, ...body } = report;
  if (expected.code !== 'OK'
    || report.numerator !== expected.numerator
    || report.denominator !== expected.denominator
    || !verifySignature(body, signature, publicKey, DOMAINS.FLOOR)) {
    return { status: 'UNVERIFIABLE', code: 'FLOOR_DOMAIN' };
  }
  return {
    status: 'ATTESTED',
    code: 'ATTESTED',
    numerator: report.numerator,
    denominator: report.denominator,
    method_id: report.method_id,
    claim: report,
  };
}