// Must be imported before anything else in main.tsx so Sentry instruments the
// app from the first render. Built-in default DSN so the portal reports errors
// with zero configuration; set VITE_SENTRY_DSN (build-time env) to override.
import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN ||
  'https://887c589b21d8ebaab97fa46a1f74f575@o4512044306530304.ingest.us.sentry.io/4512044314853376'

Sentry.init({
  dsn,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  // request/spans on every navigation are too noisy for prod at 100%
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
})
