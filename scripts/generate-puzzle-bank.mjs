import { readFileSync, writeFileSync } from 'node:fs'

const gcd = (a, b) => { let x = Math.abs(a); let y = Math.abs(b); while (y) [x, y] = [y, x % y]; return x || 1 }
const frac = (n, d = 1) => { if (!d) throw new Error(); const g = gcd(n, d); const s = d < 0 ? -1 : 1; return [n / g * s, Math.abs(d / g)] }
const calc = (a, op, b) => {
  if (op === '+') return frac(a[0] * b[1] + b[0] * a[1], a[1] * b[1])
  if (op === '-') return frac(a[0] * b[1] - b[0] * a[1], a[1] * b[1])
  if (op === '×') return frac(a[0] * b[0], a[1] * b[1])
  return frac(a[0] * b[1], a[1] * b[0])
}
const solve = (terms) => {
  if (terms.length === 1) return terms[0].v[0] === 24 * terms[0].v[1] ? terms[0].e : undefined
  for (let i = 0; i < terms.length; i++) for (let j = i + 1; j < terms.length; j++) {
    const a = terms[i], b = terms[j], rest = terms.filter((_, k) => k !== i && k !== j)
    const candidates = [
      [calc(a.v, '+', b.v), `(${a.e} + ${b.e})`], [calc(a.v, '-', b.v), `(${a.e} − ${b.e})`],
      [calc(b.v, '-', a.v), `(${b.e} − ${a.e})`], [calc(a.v, '×', b.v), `(${a.e} × ${b.e})`]
    ]
    if (b.v[0]) candidates.push([calc(a.v, '÷', b.v), `(${a.e} ÷ ${b.e})`])
    if (a.v[0]) candidates.push([calc(b.v, '÷', a.v), `(${b.e} ÷ ${a.e})`])
    for (const [v, e] of candidates) { const result = solve([...rest, { v, e }]); if (result) return result }
  }
}

const bank = []
for (let a = 1; a <= 13; a++) for (let b = a; b <= 13; b++) for (let c = b; c <= 13; c++) for (let d = c; d <= 13; d++) {
  const values = [a, b, c, d]
  const solution = solve(values.map((value) => ({ v: frac(value), e: String(value) })))
  if (solution) bank.push({ id: values.join('-'), values, solution })
}
const target = new URL('../src/game/puzzle-bank.json', import.meta.url)
const generated = `${JSON.stringify(bank)}\n`

if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8')
  if (current !== generated) {
    console.error('Puzzle bank is out of date. Run: npm run generate:puzzles')
    process.exitCode = 1
  } else {
    console.log(`Puzzle bank is current (${bank.length} solvable puzzles).`)
  }
} else {
  writeFileSync(target, generated)
  console.log(`Generated ${bank.length} solvable puzzles.`)
}
