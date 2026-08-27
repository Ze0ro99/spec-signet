function gcd(a, b) {
  while (b !== 0n) [a, b] = [b, a % b]
  return a < 0n ? -a : a
}

export function computeFloor(input, S, Q) {
  const values = typeof input === 'object' ? input : { R: input, S, Q }
  const { R, S: supply, Q: quantity } = values
  for (const [name, value] of Object.entries({ R, S: supply, Q: quantity })) {
    if (typeof value !== 'bigint' || value < 0n) throw new TypeError(`${name} must be a non-negative BigInt`)
  }
  const denominator = (R + supply) ** 2n
  if (denominator === 0n) return { code: 'FLOOR_UNDEFINED' }
  const numerator = R * quantity
  const divisor = gcd(numerator, denominator)
  return { code: 'OK', numerator: numerator / divisor, denominator: denominator / divisor }
}

export const pFloor = computeFloor
