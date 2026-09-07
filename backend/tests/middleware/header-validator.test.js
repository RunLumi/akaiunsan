import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { APP_KEY } from '../helpers/db';

// headerValidator used to console.log every request's headers — including the
// Authorization token — straight to stdout. Pin that it stays gone.
// (Plain monkey-patch instead of vi.spyOn: vitest's spy deadlocks when the
// middleware under test logs synchronously during the request.)
describe('headerValidator logging', () => {
  it('does not log request headers when validating app_key', async () => {
      const original = console.log;
      const logged = [];
      console.log = (...args) => {
        logged.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
      };

    try {
      const res = await request(app)
        .get('/guest/provinces')
        .set('app_key', APP_KEY)
        .set('Authorization', 'Bearer super-secret-token');

      expect(res.status).toBe(200);
      expect(logged.join('\n')).not.toContain('super-secret-token');
      expect(logged.join('\n')).not.toContain('app_key');
    } finally {
      console.log = original;
    }
  });
});
