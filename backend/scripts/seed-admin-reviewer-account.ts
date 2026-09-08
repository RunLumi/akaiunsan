import db from '../models/index.ts';
import { runMigrations } from '../helpers/migrator.ts';
import { encryptPassword } from '../helpers/security.ts';

const DEFAULT_USERNAME = 'admin-reviewer@akaiunsan.com';
const ROLE_NAME = 'Login Reviewer';

/**
 * Creates or refreshes a non-personal, login-only back-office account.
 * The Admin.role marker permits SPA login, while the linked Role deliberately
 * has no permissions for protected management routes.
 */
export async function seedAdminReviewerAccount() {
  const username = (
    process.env.ADMIN_REVIEWER_ACCOUNT_USERNAME || DEFAULT_USERNAME
  ).trim().toLowerCase();
  const password = (process.env.ADMIN_REVIEWER_ACCOUNT_PASSWORD || '').trim();

  if (!password) {
    throw new Error('ADMIN_REVIEWER_ACCOUNT_PASSWORD is required');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_REVIEWER_ACCOUNT_PASSWORD must be at least 12 characters');
  }
  if (!username || !username.includes('@')) {
    throw new Error('ADMIN_REVIEWER_ACCOUNT_USERNAME must be a valid email address');
  }

  await runMigrations();
  const [role] = await db.Role.findOrCreate({
    where: { role_name: ROLE_NAME },
    defaults: { permission: '' },
  });
  if (role.permission !== '') {
    await role.update({ permission: '' });
  }

  const hashedPassword = await encryptPassword(password);
  const account = {
    firstname: 'Akaiunsan',
    lastname: 'Reviewer',
    username,
    email: username,
    password: hashedPassword,
    role: 'admin',
    role_id: role.id,
    active: true,
  };
  const existing = await db.Admin.findOne({ where: { username } });

  if (existing) {
    await existing.update(account);
    return 'updated';
  }

  await db.Admin.create(account);
  return 'created';
}

if (require.main === module) {
  seedAdminReviewerAccount()
    .then((result) => {
      console.log(`admin reviewer account ${result}`);
    })
    .catch((error) => {
      console.error(`admin reviewer account seed failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db.sequelize.close();
    });
}
