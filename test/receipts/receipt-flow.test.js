import test from 'node:test'
import assert from 'node:assert/strict'
import { InMemoryReceiptStore } from '../../src/receipt/store.js'

test('receipt store claims once and does not burn denied claims', async () => {
  const store = new InMemoryReceiptStore()
  assert.equal(await store.claimIfAbsent('app', 'evidence', 'window'), true)
  assert.equal(await store.claimIfAbsent('app', 'evidence', 'window'), false)
  assert.equal(await store.claimIfAbsent('app', 'denied', 'window'), true)
})
