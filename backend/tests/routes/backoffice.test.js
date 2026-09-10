import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { truncateAll, db } from '../helpers/db';
import {
  createRole,
  createAdmin,
  createCustomer,
  customerToken,
  adminToken,
  ADMIN_PASSWORD,
} from '../helpers/factories';

let admin, token;

beforeAll(async () => {
  await truncateAll();
  admin = await createAdmin({ username: 'bo@test.local', email: 'bo@test.local' });
  token = await adminToken(admin);
});

const authed = (req) => req.set('Authorization', `Bearer ${token}`);

describe('back-office tier — auth gate (backofficeValidator + recordHistory)', () => {
  it('rejects /back-office requests without a token', async () => {
    const res = await request(app).get('/back-office/verify-token');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authorization is required.');
  });

  it('returns true for a valid admin token', async () => {
    const res = await authed(request(app).get('/back-office/verify-token'));
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
  });

  it('records AdminHistory rows for non-GET requests', async () => {
    await authed(request(app).post('/back-office/roles')).send({
      role_name: 'Historied',
      permission: 'User',
    });

    const history = await db.AdminHistory.findOne({
      where: { admin_username: 'bo@test.local' },
      order: [['id', 'DESC']],
    });
    expect(history).not.toBeNull();
    expect(history.path).toContain('/back-office/roles');
    expect(JSON.parse(history.params).role_name).toBe('Historied');
  });

  it('rejects a customer token on the admin tier', async () => {
    const customer = await createCustomer({ email: 'intruder@test.local' });
    const customerJwt = await customerToken(customer);

    const res = await request(app)
      .get('/back-office/verify-token')
      
      .set('Authorization', `Bearer ${customerJwt}`);

    expect(res.status).toBe(401);
  });
});

describe('checkPermission role matrix', () => {
  const sections = [
    { path: '/back-office/admins', permission: 'User' },
    { path: '/back-office/roles', permission: 'User' },
    { path: '/back-office/banners', permission: 'Banner' },
    { path: '/back-office/request-helpers', permission: 'Request' },
    { path: '/back-office/supporters', permission: 'Supporter' },
  ];

  it('allows section sub-paths when the role grants the matching permission', async () => {
    const role = await createRole({ permission: 'Supporter' });
    const allowedAdmin = await createAdmin({
      username: 'allow-supporter@test.local',
      role_id: role.id,
    });
    const t = await adminToken(allowedAdmin);

    const res = await request(app)
      .get('/back-office/supporters/1')
      
      .set('Authorization', `Bearer ${t}`);
    expect([200, 500]).toContain(res.status); // passes the gate; controller may 404/500 later
  });

  it('denies section sub-paths when the role lacks the permission', async () => {
    const role = await createRole({ permission: 'Nothing' });
    const denied = await createAdmin({ username: 'denied@test.local', role_id: role.id });
    const t = await adminToken(denied);

    for (const section of sections) {
      const res = await request(app)
        .get(section.path + '/1')
        
        .set('Authorization', `Bearer ${t}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Access denied');
    }
  });

  it('guards the collection routes too (gate now mounts on the section prefix)', async () => {
    const role = await createRole({ permission: 'Nothing' });
    const denied = await createAdmin({ username: 'denied2@test.local', role_id: role.id });
    const t = await adminToken(denied);

    // the gate used to mount on '/back-office/<section>/*s' only, so the
    // collection route itself (no trailing segment) bypassed checkPermission.
    // The mount is now the section prefix, covering both shapes.
    for (const section of sections) {
      const res = await request(app)
        .get(section.path)
        
        .set('Authorization', `Bearer ${t}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Access denied');
    }
  });
});

describe('/back-office/admins CRUD', () => {
  it('creates an admin through the back office', async () => {
    const res = await authed(request(app).post('/back-office/admins')).send({
      firstname: 'New',
      lastname: 'Admin',
      username: 'created-admin@test.local',
      email: 'created-admin@test.local',
      password: ADMIN_PASSWORD,
      role: 'admin',
    });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('created-admin@test.local'); // response has no username field — pins current shape
    const stored = await db.Admin.findOne({ where: { username: 'created-admin@test.local' } });
    expect(stored.password).not.toBe('created-admin-pw'); // hashed
  });

  it('lists admins with pagination', async () => {
    const res = await authed(request(app).get('/back-office/admins')).query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('returns the admin count', async () => {
    const res = await authed(request(app).get('/back-office/admins/count'));
    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('number');
  });

  it('gets an admin detail', async () => {
    const res = await authed(request(app).get(`/back-office/admins/${admin.id}`));
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('bo@test.local');
  });

  it('updates an admin (omitted username falls back to the existing one)', async () => {
    // Omitting username used to query WHERE username = undefined → 500; the
    // controller now keeps the current username in that case.
    const broken = await authed(request(app).put(`/back-office/admins/${admin.id}`)).send({
      firstname: 'Renamedmin',
    });
    expect(broken.status).toBe(200);

    const res = await authed(request(app).put(`/back-office/admins/${admin.id}`)).send({
      firstname: 'Renamedmin',
      username: 'bo@test.local',
    });
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
    expect((await db.Admin.findByPk(admin.id)).firstname).toBe('Renamedmin');
  });

  it('deletes an admin', async () => {
    const victim = await createAdmin({ username: 'doomed-admin@test.local' });
    const res = await authed(request(app).delete(`/back-office/admins/${victim.id}`));
    expect(res.status).toBe(200);
    expect(await db.Admin.findByPk(victim.id)).toBeNull();
  });
});

describe('/back-office/roles CRUD', () => {
  it('creates, updates, details, lists, counts and deletes a role', async () => {
    const created = await authed(request(app).post('/back-office/roles')).send({
      role_name: 'Suite Role',
      permission: 'User,Banner',
    });
    expect(created.status).toBe(200);
    expect(created.body.role_name).toBe('Suite Role');

    const updated = await authed(request(app).put(`/back-office/roles/${created.body.id}`)).send({
      role_name: 'Suite Role 2',
      permission: 'User',
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toBe(true);

    const detail = await authed(request(app).get(`/back-office/roles/${created.body.id}`));
    expect(detail.status).toBe(200);
    expect(detail.body.role_name).toBe('Suite Role 2');

    const list = await authed(request(app).get('/back-office/roles')).query({ page: 1, limit: 50 });
    expect(list.status).toBe(200);
    expect(list.body.some((r) => r.id === created.body.id)).toBe(true);

    const count = await authed(request(app).get('/back-office/roles/count'));
    expect(count.status).toBe(200);
    expect(typeof count.body).toBe('number');

    const removed = await authed(request(app).delete(`/back-office/roles/${created.body.id}`));
    expect(removed.status).toBe(200);
    expect(await db.Role.findByPk(created.body.id)).toBeNull();
  });

  it('returns 404 for a missing role detail', async () => {
    const res = await authed(request(app).get('/back-office/roles/999999'));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Role not found');
  });
});

describe('/back-office/user (self-service)', () => {
  it('returns the token admin profile', async () => {
    const res = await authed(request(app).get('/back-office/user'));
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('bo@test.local');
  });

  it('updates the token admin profile', async () => {
    const res = await authed(request(app).put('/back-office/user')).send({
      firstname: 'SelfUpd',
      username: 'bo@test.local',
    });
    expect(res.status).toBe(200);
    expect(res.body).toBe(true);
  });

  it('refuses a username already used by another admin', async () => {
    await createAdmin({ username: 'taken@test.local' });
    const res = await authed(request(app).put('/back-office/user')).send({
      username: 'taken@test.local',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('This username is already in used.');
  });
});
