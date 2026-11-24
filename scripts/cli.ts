import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { decide, summarizePlan, validateSummary, type GateDecision } from '../src/plan.ts'

function formatDecision(result: GateDecision): string {
  const lines = [result.verdict, ...result.reasons]
  for (const change of result.evidence) {
    const actions = change.moved ? ['move', ...change.actions.filter(action => action !== 'no-op')] : change.actions
    const fields = change.fields.length ? ` (${change.fields.join(', ')})` : ''
    lines.push(`- ${change.type}: ${actions.join(' + ')}${fields}`)
  }
  return lines.join('\n')
}

const args = process.argv.slice(2)
const hasFormat = args.length >= 7 && args.at(-2) === '--format'
const format = hasFormat ? args.at(-1) : 'json'
const [mode, root, path, address, id, arn, ...extra] = hasFormat ? args.slice(0, -2) : args
if ((mode !== 'summary' && mode !== 'check') || !root || !path || !address || !id || extra.length ||
  (format !== 'json' && format !== 'text') || (mode === 'summary' && format === 'text')) {
  console.error('Usage: node scripts/cli.ts <summary|check> <terraform-root> <saved-plan> <address> <existing-id> [aws-arn]')
  console.error('Use --format text with check for a readable verdict.')
  process.exit(2)
}

try {
  const json = execFileSync('terraform', [`-chdir=${resolve(root)}`, 'show', '-json', resolve(path)], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const target = arn === undefined ? { address, id } : { address, id, arn }
  const summary = validateSummary(summarizePlan(JSON.parse(json), target))
  const result = decide(summary)
  console.log(format === 'text' ? formatDecision(result) : JSON.stringify(mode === 'summary' ? summary : result, null, 2))
  if (mode === 'check' && result.verdict === 'BLOCKED') process.exitCode = 1
} catch {
  console.error('Could not read the saved plan. Check the path and initialize its Terraform root.')
  process.exitCode = 2
}
