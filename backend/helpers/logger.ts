import pino from 'pino';

// Structured logger. Auth material is redacted at the pino level so no call
// site can leak it.
const REDACT_PATHS = [
  'req.headers.authorization',
  'headers.authorization',
  'authorization',
];

export interface LoggerOptions {
  level?: string;
  stream?: NodeJS.WritableStream;
}

export function makeLogger(options: LoggerOptions = {}) {
  return pino(
    {
      level: options.level || process.env.LOG_LEVEL || 'info',
      redact: REDACT_PATHS,
      base: undefined,
    },
    options.stream
  );
}

export const logger = makeLogger();
