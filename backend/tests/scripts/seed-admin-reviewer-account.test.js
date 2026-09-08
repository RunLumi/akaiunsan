import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { truncateAll, db } from '../helpers/db.ts';
import { comparePassword } from '../../helpers/security.ts';
import { seedAdminReviewerAccount } from '../../scripts/seed-admin-reviewer-account.ts';

const TEST_USERNAME = 'admin-reviewer@test.local';
const TEST_PASSWORD = 'admin-reviewer-test-password';

beforeEach(async () => {
  await truncateAll();
  process.env.ADMIN_REVIEWER_ACCOUNT_USERNAME = TEST_USERNAME;
  process.env.ADMIN_REVIEWER_ACCOUNT_PASSWORD = TEST_PASSWORD;
});

afterEach(() => {
  delete process.env.ADMIN_REVIEWER_ACCOUNT_USERNAME;
  delete process.env.ADMIN_REVIEWER_ACCOUNT_PASSWORD;
});

describe('seedAdminReviewerAccount', () => {
  it('creates an active admin marker linked to a zero-permission role', async () => {
    await expect(seedAdminReviewerAccount()).resolves.toBe('created');

    const admin = await db.Admin.findOne({ where: { username: TEST_USERNAME } });
    const role = await db.Role.findByPk(admin.role_id);

    expect(admin).toMatchObject({
      email: TEST_USERNAME,
      role: 'admin',
      active: true,
    });
    expect(role).toMatchObject({ role_name: 'Login Reviewer', permission: '' });
    await expect(comparePassword(TEST_PASSWORD, admin.password)).resolves.toBe(true);
  });

  it('refreshes the account and removes permissions added to its role', async () => {
    await seedAdminReviewerAccount();
    const role = await db.Role.findOne({ where: { role_name: 'Login Reviewer' } });
    await role.update({ permission: 'User' });
    await db.Admin.update(
      { role: 'reviewer', active: false },
      { where: { username: TEST_USERNAME } },
    );

    await expect(seedAdminReviewerAccount()).resolves.toBe('updated');

    const admin = await db.Admin.findOne({ where: { username: TEST_USERNAME } });
    await role.reload();
    expect(admin).toMatchObject({ role: 'admin', active: true, role_id: role.id });
    expect(role.permission).toBe('');
  });

  it('requires a strong password and valid username', async () => {
    delete process.env.ADMIN_REVIEWER_ACCOUNT_PASSWORD;
    await expect(seedAdminReviewerAccount()).rejects.toThrow(
      'ADMIN_REVIEWER_ACCOUNT_PASSWORD is required',
    );

    process.env.ADMIN_REVIEWER_ACCOUNT_PASSWORD = 'short';
    await expect(seedAdminReviewerAccount()).rejects.toThrow('at least 12 characters');

    process.env.ADMIN_REVIEWER_ACCOUNT_PASSWORD = TEST_PASSWORD;
    process.env.ADMIN_REVIEWER_ACCOUNT_USERNAME = 'invalid';
    await expect(seedAdminReviewerAccount()).rejects.toThrow('must be a valid email address');
  });
});
