# Google Play reviewer account

The Android app requires a customer account to reach the authenticated booking
journey. Google Play review uses the non-personal account below:

- Email: `reviewer@akaiunsan.com`
- Password: supplied privately in the Play Console review instructions and in
  the production deployment secret; it is not committed to this repository.

## Create or refresh the account

The backend seed is idempotent. It creates the account if it does not exist and
refreshes its password and active status if it does.

Set the values only in the production environment:

```bash
export REVIEWER_ACCOUNT_EMAIL=reviewer@akaiunsan.com
export REVIEWER_ACCOUNT_PASSWORD='use-a-random-12-plus-character-password'
```

For a local database:

```bash
cd backend
npm run seed:reviewer
```

For the production Docker service, set `SEED_REVIEWER_ACCOUNT=1` in the VPS
`deploy/.env` and restart the backend. The container entrypoint runs the seed
before starting Express. After the first successful start, set the flag back to
`0` while keeping the account password available for future deliberate resets.

The command never emails the password, stores it in source control, or prints
it to logs.

## Review test path

1. Open the Android app.
2. Sign in with the supplied reviewer email and password.
3. Confirm the home screen loads and the account can open the booking flow.
4. Confirm the app can view service/helper data and reach the request form.
5. Do not submit a paid booking or enter real payment details during review.

The public legal pages used by the app and Play listing are:

- [Privacy Policy](https://akaiunsan.com/privacy-policy)
- [Terms of Service](https://akaiunsan.com/terms-of-service)
