import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { decide, summarizePlan, validateSummary } from '../src/plan.ts'

const [mode, root, path, address, id, arn, ...extra] = process.argv.slice(2)
if ((mode !== 'summary' && mode !== 'check') || !root || !path || !address || !id || extra.length) {
  console.error('Usage: node scripts/cli.ts <summary|check> <terraform-root> <saved-plan> <address> <existing-id> [aws-arn]')
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
  console.log(JSON.stringify(mode === 'summary' ? summary : result, null, 2))
  if (mode === 'check' && result.verdict === 'BLOCKED') process.exitCode = 1
} catch {
  console.error('Could not read the saved plan. Check the path and initialize its Terraform root.')
  process.exitCode = 2
}
