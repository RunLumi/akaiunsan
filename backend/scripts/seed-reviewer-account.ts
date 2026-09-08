import db from '../models/index.ts';
import { runMigrations } from '../helpers/migrator.ts';
import { encryptPassword } from '../helpers/security.ts';

const email = (process.env.REVIEWER_ACCOUNT_EMAIL || 'reviewer@akaiunsan.com').trim().toLowerCase();
const password = (process.env.REVIEWER_ACCOUNT_PASSWORD || '').trim();

/**
 * Creates or refreshes the non-personal customer account used by store
 * reviewers. Credentials are supplied by deployment environment variables so
 * no password is stored in source control or emitted to logs.
 */
export async function seedReviewerAccount() {
  if (!password) {
    throw new Error('REVIEWER_ACCOUNT_PASSWORD is required');
  }
  if (password.length < 12) {
    throw new Error('REVIEWER_ACCOUNT_PASSWORD must be at least 12 characters');
  }
  if (!email || !email.includes('@')) {
    throw new Error('REVIEWER_ACCOUNT_EMAIL must be a valid email address');
  }

  await runMigrations();
  const hashedPassword = await encryptPassword(password);
  const existing = await db.Customer.findOne({ where: { email } });

  if (existing) {
    await existing.update({
      firstname: 'Akaiunsan',
      lastname: 'Reviewer',
      display_name: 'Akaiunsan Play Reviewer',
      password: hashedPassword,
      active: true,
    });
    return 'updated';
  }

  await db.Customer.create({
    firstname: 'Akaiunsan',
    lastname: 'Reviewer',
    display_name: 'Akaiunsan Play Reviewer',
    email,
    password: hashedPassword,
    active: true,
  });
  return 'created';
}

if (require.main === module) {
  seedReviewerAccount()
    .then((result) => {
      console.log(`reviewer account ${result}`);
    })
    .catch((error) => {
      console.error(`reviewer account seed failed: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db.sequelize.close();
    });
}
