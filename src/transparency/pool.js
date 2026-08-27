export function poolInvariant(samples, tau = 0) {
  if (!Array.isArray(samples) || samples.length === 0) return []
  const initial = BigInt(samples[0].x) * BigInt(samples[0].y)
  return samples.map((sample) => {
    const k = BigInt(sample.x) * BigInt(sample.y)
    const delta = k - initial
    const drop = initial !== 0n && Number((-delta * 1000000n) / initial) > tau * 1000000
    const status = drop ? 'K_DROP' : delta > 0n ? 'K_UP' : 'K_OK'
    return { ...sample, k: Number(k), status, code: status }
  })
}
