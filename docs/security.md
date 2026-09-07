# Security Notes (READ BEFORE TOUCHING THIS REPO)

**This repository currently has real credentials committed to git.** This is a known problem, not an instruction to continue the practice. As of the last audit it contains:

- Database root/user passwords in `backend/docker-compose.yml` (plaintext).
- Live environment configs in `backend/config/{local,development,production}.json` — DB credentials, JWT secret, Omise secret keys, app key.
- A Google service credential file `backend/config/g-cred.json`.
- Apple push certs/keys, Android release keystores (`grabtasker.keystore`, `grabtasker.jks`, `*.p12`, `*.p8`, `*.mobileprovision`, `*.key`) in `apps/`.
- Server SSH/panel passwords and developer-account passwords in `apps/README.md`, `backend/README.md`, and `backend/work-note.txt` (also an example Facebook access token in `work-note.txt`).

## Rules for agents working in this repo

1. **Never print, copy, log, or "helpfully summarize" secret values** from these files into chat output, new files, commits, or docs. Refer to them by filename only.
2. **Never commit new secrets.** Backend secrets belong in `config/<env>.json` (gitignored in a proper setup) or environment variables; app secrets belong outside git.
3. Do not modify or "rotate" credentials unless explicitly asked — that can break running production services.
4. If a task seems to require publishing one of these values (e.g., into a log or a support ticket), stop and say so instead.

## Recommended remediation (not yet done)

- Move `backend/config/*.json` real values out of git into env vars or a secret manager; replace committed files with `config/readme.md`-style templates.
- Remove `g-cred.json`, signing keys, and provisioning profiles from the repo and rotate them (they remain in git history even after deletion — history rewrite or credential rotation is required).
- Scrub passwords from the README/work-note files.
- Add `.env*` and key material patterns to `.gitignore` in both subprojects.

Any agent asked to "clean up security" should treat this list as the backlog.
