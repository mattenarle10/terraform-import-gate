import { isDeepStrictEqual } from 'node:util'

const identifier = /^[a-z][a-z0-9_]{0,79}$/
const regionalAwsArn = /^arn:aws(?:-[a-z0-9-]+)?:[a-z0-9-]+:[a-z0-9-]+:\d{12}:[^\s]+$/
const actionNames = ['no-op', 'create', 'read', 'update', 'delete', 'forget', 'unsupported'] as const
type PlanAction = typeof actionNames[number]

interface ResourceChange {
  type: string
  actions: PlanAction[]
  imported: boolean
  target: boolean
  managed: boolean
  moved: boolean
  fields: string[]
}

interface PlanSummary {
  version: 1
  complete: boolean
  changes: ResourceChange[]
}

export interface GateDecision {
  verdict: 'IMPORT ONLY' | 'BLOCKED'
  reasons: string[]
  evidence: ResourceChange[]
}

interface ExpectedImport {
  address: string
  id: string
  arn?: string
}

const actions = new Set<string>(actionNames)
const listLimit = 64
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const isAction = (value: unknown): value is PlanAction => typeof value === 'string' && actions.has(value)
const isIdentifier = (value: unknown): value is string => typeof value === 'string' && identifier.test(value)

export function summarizePlan(plan: unknown, target: ExpectedImport): PlanSummary {
  if (!isRecord(plan) || typeof plan.format_version !== 'string' ||
      !/^1\.\d+$/.test(plan.format_version) || !Array.isArray(plan.resource_changes)) {
    throw new Error('Expected Terraform plan JSON format 1.x.')
  }

  const changes: ResourceChange[] = []
  for (const entry of plan.resource_changes as unknown[]) {
    const resource = isRecord(entry) ? entry : {}
    const change = isRecord(resource.change) ? resource.change : {}
    const planned: PlanAction[] = Array.isArray(change.actions) && change.actions.length > 0 &&
      change.actions.every(isAction)
      ? change.actions : ['unsupported']
    const importing = isRecord(change.importing) ? change.importing : undefined
    const moved = Boolean(resource.previous_address && resource.previous_address !== resource.address)
    if (!importing && !moved && isDeepStrictEqual(planned, ['no-op'])) continue

    const before = isRecord(change.before) ? change.before : {}
    const after = isRecord(change.after) ? change.after : {}
    const type = isIdentifier(resource.type) ? resource.type : 'unknown'
    const awsResource = /^aws(?:cc)?_/.test(type)
    const actualArn = type === 'aws_cloudwatch_log_group' && typeof before.arn === 'string'
      ? before.arn.replace(/:\*$/, '')
      : before.arn
    const expectedArn = type === 'aws_cloudwatch_log_group' ? target.arn?.replace(/:\*$/, '') : target.arn
    const awsIdentityMatches = expectedArn !== undefined &&
      regionalAwsArn.test(expectedArn) && actualArn === expectedArn
    const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])]
      .filter(field => isIdentifier(field) && !isDeepStrictEqual(before[field], after[field]))
      .sort()
      .slice(0, 16)

    changes.push({
      type,
      actions: planned,
      imported: importing !== undefined,
      target: resource.address === target.address && importing?.id === target.id &&
        (!(awsResource || target.arn !== undefined) || awsIdentityMatches),
      managed: resource.mode === 'managed',
      moved,
      fields,
    })
  }

  // A resource no-op is insufficient when Terraform has other work queued.
  const complete = plan.complete === true && plan.applyable === true && plan.errored === false &&
    ['action_invocations', 'deferred_changes', 'resource_drift'].every(key => {
      const entries = plan[key]
      return entries === undefined || (Array.isArray(entries) && entries.length === 0)
    })

  return { version: 1, complete: complete && changes.length <= listLimit, changes: changes.slice(0, listLimit) }
}

export function validateSummary(summary: unknown): PlanSummary {
  if (!isRecord(summary) || summary.version !== 1 || typeof summary.complete !== 'boolean' ||
      !Array.isArray(summary.changes) || summary.changes.length > listLimit) {
    throw new Error('Upload a version 1 summary from the import gate CLI.')
  }

  return {
    version: 1,
    complete: summary.complete,
    changes: (summary.changes as unknown[]).map(change => {
      if (!isRecord(change)) throw new Error('The summary contains an invalid resource action.')
      const { type, actions: planned, imported, target, managed, moved, fields } = change
      if (!isIdentifier(type) || !Array.isArray(planned) || planned.length < 1 || planned.length > 4 ||
          !planned.every(isAction) || !Array.isArray(fields) || fields.length > 16 ||
          !fields.every(isIdentifier) || typeof imported !== 'boolean' || typeof target !== 'boolean' ||
          typeof managed !== 'boolean' || typeof moved !== 'boolean') {
        throw new Error('The summary contains an invalid resource action.')
      }
      return { type, actions: planned, imported, target, managed, moved, fields }
    }),
  }
}

export function decide(summary: PlanSummary): GateDecision {
  const imports = summary.changes.filter(change => change.imported)
  const evidence = summary.changes.filter(change =>
    change.moved || !isDeepStrictEqual(change.actions, ['no-op']) ||
    !change.imported || !change.managed || !change.target || change.type === 'unknown')
  const reasons = []
  if (!summary.complete) reasons.push('The plan is incomplete, has drift, or contains unsupported work.')
  if (imports.length !== 1 || !imports[0]?.target || !imports[0]?.managed) {
    reasons.push('Check the resource address, import ID, and ARN against the one intended import.')
  }
  if (evidence.length > 0) reasons.push('The plan contains actions beyond the intended import.')

  return { verdict: reasons.length === 0 ? 'IMPORT ONLY' : 'BLOCKED', reasons, evidence }
}
