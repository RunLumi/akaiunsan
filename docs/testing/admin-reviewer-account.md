# Admin reviewer account

The production admin portal has a non-personal account for login smoke tests:

- Username: `admin-reviewer@akaiunsan.com`
- Password: stored only in the production deployment secret; never commit or
  print it.
- Access: login-only. The account has the SPA-required `admin` marker, linked
  to a role with an empty permission list. Protected management API routes must
  continue to reject it.

## Create or refresh the account

Set the values only in the target environment:

```bash
export ADMIN_REVIEWER_ACCOUNT_USERNAME=admin-reviewer@akaiunsan.com
export ADMIN_REVIEWER_ACCOUNT_PASSWORD='use-a-random-12-plus-character-password'
```

For a local database:

```bash
cd backend
npm run seed:admin-reviewer
```

For production Docker, set `SEED_ADMIN_REVIEWER_ACCOUNT=1` in the VPS
`deploy/.env` and restart the backend. After a successful seed, set the flag
back to `0`; keep the password secret available for deliberate future resets.

## Smoke-test path

1. Open <https://akai-admin.cjs.vn/sign-in?redirect=%2F>.
2. Sign in with the private account credentials without saving the password.
3. Confirm navigation reaches the dashboard root.
4. Confirm protected management APIs return access denied for this account.
5. Do not grant permissions merely to make a smoke test pass.
