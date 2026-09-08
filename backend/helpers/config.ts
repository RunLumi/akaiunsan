import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Central, zod-validated config loader. Replaces the per-file
// JSON.parse(fs.readFileSync(...)) reads so a malformed config fails fast at
// boot with a readable error naming the file and the offending key.

const DbConnectionSchema = z.object({
  database: z.string(),
  user: z.string(),
  password: z.string(),
  host: z.string(),
  port: z.union([z.number(), z.string()]).optional(),
  // mysql dialect: connect through a unix socket instead of host:port
  socketPath: z.string().optional(),
});

const MailConfigSchema = z.object({
  host: z.string(),
  port: z.union([z.number(), z.string()]),
  secure: z.boolean(),
  user: z.string(),
  password: z.string(),
});

const OmiseSchema = z.object({
  secretKey: z.string(),
  omiseVersion: z.string(),
});

export const ConfigSchema = z
  .object({
    'db-connection': DbConnectionSchema,
    'jwt-secret': z.string().min(1),
    'app_key': z.string().min(1),
    'mail-config': MailConfigSchema.optional(),
    'omise': OmiseSchema.optional(),
    'dialect': z.enum(['mysql', 'postgres']).optional(),
  })
  .passthrough(); // agency-connection, sftp-connection, image_base_url, sentry-dsn, ...

export type AppConfig = z.infer<typeof ConfigSchema> & Record<string, any>;

/**
 * Reads and validates `config/<env>.json` relative to the process cwd — the
 * same convention models/index.ts uses, so tsx, vitest, `node dist/app.js`
 * and pm2 all resolve identically.
 */
export function loadConfig(env: string = process.env.NODE_ENV || 'local'): AppConfig {
  const file = path.join('config', `${env}.json`);
  let raw: string;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (e: any) {
    throw new Error(`cannot read config file ${file}: ${e.message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    throw new Error(`config file ${file} is not valid JSON: ${e.message}`);
  }

  const result = ConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    throw new Error(`config file ${file} failed validation → ${issues}`);
  }
  return result.data as AppConfig;
}
