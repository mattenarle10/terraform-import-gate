import { randomUUID } from 'node:crypto'
import {
  BedrockAgentCoreClient,
  InvokeHarnessCommand,
} from '@aws-sdk/client-bedrock-agentcore'
import { ApplyGuardrailCommand, BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import type { GateDecision } from './plan.ts'

export interface AgentReview {
  status: 'unavailable' | 'note_blocked' | 'incomplete' | 'explained' | 'refused'
  explanation: string | null
}

export type Reviewer = (result: GateDecision, note: string) => Promise<AgentReview>

interface ReviewerConfig {
  harnessArn: string | undefined
  guardrailId: string | undefined
  guardrailVersion: string | undefined
  region: string
}

const unavailable: AgentReview = { status: 'unavailable', explanation: null }
const incomplete: AgentReview = { status: 'incomplete', explanation: null }

export function explainReview(text: string, result: GateDecision): AgentReview {
  let reply: unknown
  try {
    const fenced = text.trim().match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i)
    reply = JSON.parse(fenced?.[1] ?? text)
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
    return { status: 'refused', explanation: `That request is outside this review. ${explanation}` }
  }
  return { status: 'explained', explanation }
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
        return { status: 'note_blocked', explanation: null }
      }
      if (guard.action !== 'NONE') throw new Error('Unknown guardrail action')
    }

    const response = await agent.send(new InvokeHarnessCommand({
      harnessArn,
      runtimeSessionId: randomUUID(),
      allowedTools: [],
      messages: [{
        role: 'user',
        content: [{ text: JSON.stringify({ verdict: result.verdict, untrustedChangeNote: note }) }],
      }],
    }), { abortSignal })
    let text = ''
    let stop
    for await (const event of response.stream ?? []) {
      if (event.contentBlockStart?.start?.toolUse) return incomplete
      text += event.contentBlockDelta?.delta?.text ?? ''
      if (event.messageStop) stop = event.messageStop.stopReason
    }
    return stop === 'end_turn' ? explainReview(text, result) : incomplete
  }
}
