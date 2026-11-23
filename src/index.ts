import { handle } from 'hono/aws-lambda'
import { createReviewer } from './agent.ts'
import { createApp } from './app.ts'

const review = createReviewer({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  harnessArn: process.env.HARNESS_ARN,
  guardrailId: process.env.GUARDRAIL_ID,
  guardrailVersion: process.env.GUARDRAIL_VERSION,
})
export const app = createApp({ review, tokenHash: process.env.ACCESS_TOKEN_SHA256 })
export const handler = handle(app)
