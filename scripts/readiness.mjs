import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const required = ['LICENSE', 'README.md', 'docs/MATURITY.md', 'docs/NICOLAS_TRACE.md', 'vectors/transparency/dashboard-stable.json']
for (const file of required) if (!existsSync(file)) throw new Error(`missing artifact: ${file}`)
const maturity = readFileSync('docs/MATURITY.md', 'utf8')
if (!/0\.x|not audited|not production/i.test(maturity)) throw new Error('maturity overclaim')
execFileSync(process.execPath, ['scripts/conformance.mjs'], { stdio: 'inherit' })
console.log('READINESS AUDIT OK: SIGNET remains 0.x and evidence artifacts exist')
