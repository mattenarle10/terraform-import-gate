import { createHash, timingSafeEqual } from 'node:crypto'
import { Hono, type MiddlewareHandler } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import type { AgentReview, Reviewer } from './agent.ts'
import { decide, validateSummary, type GateDecision } from './plan.ts'
import { page } from './page.ts'

interface AppConfig {
  review: Reviewer
  tokenHash: string | undefined
}

function inlineHash(tag: 'style' | 'script') {
  const content = page.split(`<${tag}>`)[1]?.split(`</${tag}>`)[0]
  if (!content) throw new Error(`Missing inline ${tag}`)
  return `'sha256-${createHash('sha256').update(content).digest('base64')}'`
}

const contentSecurityPolicy = [
  "default-src 'none'",
  `style-src ${inlineHash('style')}`,
  `script-src ${inlineHash('script')}`,
  "connect-src 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
].join('; ')

export function createApp({ review, tokenHash }: AppConfig) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    await next()
    c.header('Cache-Control', 'no-store')
    c.header('Strict-Transport-Security', 'max-age=31536000')
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('Referrer-Policy', 'no-referrer')
    c.header('Content-Security-Policy', contentSecurityPolicy)
  })

  app.get('/', c => c.html(page))
  app.get('/health', c => c.json({ ok: true }))
  const requireAccessKey: MiddlewareHandler = async (c, next) => {
    const token = c.req.header('authorization')?.match(/^Bearer (\S{1,200})$/i)?.[1]
    const digest = token && createHash('sha256').update(token).digest('hex')
    if (!digest || !tokenHash || !/^[a-f0-9]{64}$/.test(tokenHash) ||
        !timingSafeEqual(Buffer.from(digest), Buffer.from(tokenHash))) {
      return c.json({ error: 'The access key is incorrect.' }, 401)
    }
    await next()
  }
  app.post('/unlock', requireAccessKey, c => c.body(null, 204))
  app.post('/review', requireAccessKey, bodyLimit({ maxSize: 64 * 1024 }), async c => {
    if (c.req.header('content-type')?.split(';', 1)[0] !== 'application/json') {
      return c.json({ error: 'Send application/json.' }, 415)
    }
    let result: GateDecision
    let note: string
    try {
      const request = await c.req.json<{ note?: unknown; summary?: unknown }>()
      const input = request.note ?? ''
      if (typeof input !== 'string' || input.length > 800) {
        return c.json({ error: 'Keep the change note under 800 characters.' }, 400)
      }
      note = input
      result = decide(validateSummary(request.summary))
    } catch {
      return c.json({ error: 'Upload a valid import gate summary.' }, 400)
    }

    let agent: AgentReview
    try {
      agent = await review(result, note)
    } catch (error) {
      console.error('Agent review failed', error instanceof Error ? error.name : 'Error')
      agent = { status: 'unavailable', explanation: null }
    }
    return c.json({ scope: 'uploaded_summary', ...result, agent })
  })
  return app
}
