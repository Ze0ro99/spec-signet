import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('independent Python verifier accepts the shared signed vector', () => {
  const verifier = fileURLToPath(new URL('../../sdk/python/signet_verify.py', import.meta.url));
  const vector = fileURLToPath(new URL('../../vectors/pep/cross-language.json', import.meta.url));
  const result = spawnSync('python3', [verifier, vector], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /canonical and Ed25519 checks passed/);
});