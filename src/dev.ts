import { serve } from '@hono/node-server'
import { app } from './index.ts'

serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 3000 })
console.log('http://127.0.0.1:3000')
