import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// helpers/config.ts — zod-validated config loader. Replaces the 14 ad-hoc
// JSON.parse(fs.readFileSync(...)) sites with one validated, fail-fast path.
import { loadConfig } from '../../helpers/config.ts';

const CONFIG_DIR = path.join(process.cwd(), 'config');

const validConfig = {
  'db-connection': { database: 'db', user: 'u', password: 'p', host: 'h', port: 3306 },
  'jwt-secret': 's3cret',
  'app_key': 'key-1',
  'omise': { secretKey: 'sk', omiseVersion: '2020-01-01' },
  'mail-config': { host: 'm', port: 25, secure: false, user: 'mu', password: 'mp' },
  'image_base_url': 'https://cdn/',
};

function write(name, content) {
  fs.writeFileSync(path.join(CONFIG_DIR, name), content);
}

describe('loadConfig', () => {
  it('reads config/<env>.json relative to cwd and returns the parsed object', () => {
    write('zzload-ok.json', JSON.stringify(validConfig));
    try {
      const cfg = loadConfig('zzload-ok');
      expect(cfg['db-connection'].database).toBe('db');
      expect(cfg['app_key']).toBe('key-1');
      expect(cfg['jwt-secret']).toBe('s3cret');
    } finally {
      fs.unlinkSync(path.join(CONFIG_DIR, 'zzload-ok.json'));
    }
  });

  it('fails with a readable error naming the missing file', () => {
    expect(() => loadConfig('no-such-env')).toThrow(/config\/no-such-env\.json/);
  });

  it('rejects a config missing jwt-secret and names the offending key', () => {
    write('zzload-bad.json', JSON.stringify({ ...validConfig, 'jwt-secret': undefined }));
    try {
      expect(() => loadConfig('zzload-bad')).toThrow(/jwt-secret/);
    } finally {
      fs.unlinkSync(path.join(CONFIG_DIR, 'zzload-bad.json'));
    }
  });

  it('rejects a config with a malformed db-connection and names the path', () => {
    write('zzload-bad2.json', JSON.stringify({ ...validConfig, 'db-connection': 'nope' }));
    try {
      expect(() => loadConfig('zzload-bad2')).toThrow(/db-connection/);
    } finally {
      fs.unlinkSync(path.join(CONFIG_DIR, 'zzload-bad2.json'));
    }
  });

  it('rejects invalid JSON with the file path in the error', () => {
    write('zzload-bad3.json', '{not json');
    try {
      expect(() => loadConfig('zzload-bad3')).toThrow(/zzload-bad3/);
    } finally {
      fs.unlinkSync(path.join(CONFIG_DIR, 'zzload-bad3.json'));
    }
  });

  it('passes through unknown extra keys (e.g. sentry-dsn, agency-connection)', () => {
    write('zzload-extra.json', JSON.stringify({
      ...validConfig,
      'sentry-dsn': 'https://sentry',
      'agency-connection': { host: 'a' },
    }));
    try {
      const cfg = loadConfig('zzload-extra');
      expect(cfg['sentry-dsn']).toBe('https://sentry');
      expect(cfg['agency-connection'].host).toBe('a');
    } finally {
      fs.unlinkSync(path.join(CONFIG_DIR, 'zzload-extra.json'));
    }
  });

  it('validates the real test config in the repo', () => {
    const cfg = loadConfig('test');
    expect(cfg['app_key']).toBeTruthy();
    expect(cfg['jwt-secret']).toBeTruthy();
    expect(cfg['db-connection'].database).toBe('ayasan_db_test');
  });
});
