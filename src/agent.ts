import { randomUUID } from 'node:crypto'
import {
  BedrockAgentCoreClient,
  InvokeHarnessCommand,
  type HarnessToolUseBlockStart,
  type InvokeHarnessCommandOutput,
} from '@aws-sdk/client-bedrock-agentcore'
import { ApplyGuardrailCommand, BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import type { GateDecision } from './plan.ts'

export interface AgentReview {
  status: 'unavailable' | 'note_blocked' | 'tool_required' | 'incomplete' | 'explained' | 'refused'
  toolUsed: boolean
  explanation: string | null
}

export type Reviewer = (result: GateDecision, note: string) => Promise<AgentReview>

interface ReviewerConfig {
  harnessArn: string | undefined
  guardrailId: string | undefined
  guardrailVersion: string | undefined
  region: string
}

const toolName = 'read_import_check'
const unavailable: AgentReview = { status: 'unavailable', toolUsed: false, explanation: null }
const incomplete: AgentReview = { status: 'incomplete', toolUsed: true, explanation: null }

export function explainReview(text: string, result: GateDecision): AgentReview {
  let reply: unknown
  try {
    reply = JSON.parse(text)
  } catch {
    return incomplete
  }

  if (!reply || typeof reply !== 'object' || Object.keys(reply).length !== 2 ||
      !('verdict' in reply) || reply.verdict !== result.verdict || !('disposition' in reply) ||
      (reply.disposition !== 'explain' && reply.disposition !== 'refuse')) {
    return incomplete
  }

  const explanation = result.verdict === 'IMPORT ONLY'
    ? 'The summary reports one matching import with no additional actions.'
    : result.reasons.join(' ')

  if (reply.disposition === 'refuse') {
    return { status: 'refused', toolUsed: true, explanation: `That request is outside this review. ${explanation}` }
  }
  return { status: 'explained', toolUsed: true, explanation }
}

async function consume(stream: InvokeHarnessCommandOutput['stream']) {
  const tools = new Map<number, HarnessToolUseBlockStart & { input: string }>()
  let text = ''
  let stop
  for await (const event of stream ?? []) {
    if (event.contentBlockStart?.start?.toolUse) {
      const { contentBlockIndex, start } = event.contentBlockStart
      if (typeof contentBlockIndex === 'number') {
        tools.set(contentBlockIndex, { ...start.toolUse, input: '' })
      }
    }
    if (event.contentBlockDelta) {
      const { contentBlockIndex, delta } = event.contentBlockDelta
      if (delta?.text) text += delta.text
      const tool = typeof contentBlockIndex === 'number' ? tools.get(contentBlockIndex) : undefined
      if (tool && delta?.toolUse) tool.input += delta.toolUse.input ?? ''
    }
    if (event.messageStop) stop = event.messageStop.stopReason
  }
  return { text: text.trim(), tools: [...tools.values()], stop }
}

export function createReviewer({ harnessArn, guardrailId, guardrailVersion, region }: ReviewerConfig): Reviewer {
  const agent = new BedrockAgentCoreClient({ region, maxAttempts: 1 })
  const bedrock = new BedrockRuntimeClient({ region, maxAttempts: 1 })

  return async (result, note) => {
    if (!harnessArn) return unavailable
    const abortSignal = AbortSignal.timeout(24_000)
    if (note) {
      if (!guardrailId || !guardrailVersion) return unavailable
      const guard = await bedrock.send(new ApplyGuardrailCommand({
        guardrailIdentifier: guardrailId,
        guardrailVersion,
        source: 'INPUT',
        content: [{ text: { text: note, qualifiers: ['guard_content'] } }],
      }), { abortSignal })
      if (guard.action === 'GUARDRAIL_INTERVENED') {
        return { status: 'note_blocked', toolUsed: false, explanation: null }
      }
      if (guard.action !== 'NONE') throw new Error('Unknown guardrail action')
    }

    const session = { harnessArn, runtimeSessionId: randomUUID() }
    const first = await agent.send(new InvokeHarnessCommand({
      ...session,
      messages: [{
        role: 'user',
        content: [{ text: JSON.stringify({ task: 'Explain this import review.', untrustedChangeNote: note }) }],
      }],
    }), { abortSignal })
    const handoff = await consume(first.stream)
    const [tool] = handoff.tools
    if (handoff.stop !== 'tool_use' || handoff.tools.length !== 1 ||
        tool?.name !== toolName || !tool.toolUseId || !/^\s*\{\s*\}\s*$/.test(tool.input || '{}')) {
      return { status: 'tool_required', toolUsed: false, explanation: null }
    }

    const second = await agent.send(new InvokeHarnessCommand({
      ...session,
      messages: [{
        role: 'user',
        content: [{
          toolResult: {
            toolUseId: tool.toolUseId,
            status: 'success',
            content: [{ text: JSON.stringify(result) }],
          },
        }],
      }],
    }), { abortSignal })
    const review = await consume(second.stream)
    if (review.stop !== 'end_turn' || review.tools.length || !review.text) return incomplete
    return explainReview(review.text, result)
  }
}
