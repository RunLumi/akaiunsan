# Postmortem: Backend health-check crash loop and production deployment recovery

Date: 2026-09-07
Status: Resolved
Affected component: `akaiunsan_backend` production container
Related release: `prod` deployment, verified at `32139fb`

## Summary

The production backend entered a crash loop after a TypeScript/CommonJS-to-ES-module migration emitted a route module in a shape that the compiled `dist/app.js` did not load correctly. The runtime error was:

```text
TypeError: require(...) is not a function at /app/dist/app.js:13:29
```

The deployment was repaired, rebuilt, and verified through the public health endpoint and the Docker health state. The final verified response was HTTP 200 with `status: "ok"`, `db: "up"`, `git.commit: "32139fb"`, and `git.branch: "prod"`; the backend container reported `healthy`. The repair was merged into `main` by PR #2, merge commit `2555edd`.

Customer-level impact was not independently measured in the incident record. The known impact is an unavailable or unhealthy backend during the crash-loop window; do not infer request volume, user count, or data loss without access-log and database evidence.

## Detection and evidence

- Operator deployment logs showed the backend container repeatedly failing during startup.
- The crash pointed to the compiled application entrypoint and a route-module interop mismatch.
- The first repaired image started, but `/health` exposed `git.commit: "unknown"` and `git.branch: "unknown"`; this was treated as a separate observability defect rather than accepted as complete verification.
- The final live check returned HTTP 200 from `https://akai-api.cjs.vn/health` with database connectivity, version metadata, uptime, and system information.
- `docker inspect` reported `healthy` for `akaiunsan_backend`.
- The VPS checkout was verified at the same deployed SHA and cleaned of generated `backend/version.json` residue after the check.

## Root causes

### Primary runtime failure

`app.ts` and the generated route modules used incompatible CommonJS/ES-module interop assumptions. The compiled application attempted to call the result of `require(...)` as a function while the route module exposed its implementation as a default export.

### Build-toolchain incompatibility

The Docker builder uses TypeScript 7. TypeScript 7 removed the old `moduleResolution: "node"` behavior and requires compatible settings for `.ts` import-specifier rewriting. The original build path also stopped before the post-build require-rewrite and version-generation step when semantic diagnostics were emitted.

### Missing image metadata fallback

The Docker builder does not contain the `git` binary. The build helper initially overwrote the deploy-provided version metadata with `unknown` when its `git rev-parse` fallback failed. That made the service healthy but weakened release identity and violated the verification contract.

### Operational residue

`auto-deploy.sh` writes the generated `backend/version.json` into the tracked VPS checkout before building. That file can make a later `git pull` refuse to proceed. During this recovery, the exact diff was inspected, local VPS experiments were preserved in a recoverable stash, and only generated metadata was restored. Making this path intrinsically clean remains a follow-up.

## Remediation

The following changes were delivered on `prod`:

1. Configure the backend compiler for `module: "node16"`, `moduleResolution: "node16"`, `rewriteRelativeImportExtensions: true`, and `noEmitOnError: false`.
2. Keep Docker emission running with `(tsc || true) && node scripts/fix-dist-requires.js`, allowing emitted JavaScript to be post-processed while the existing semantic-diagnostic backlog is tracked separately.
3. Ensure the post-build helper creates `dist/` before walking it.
4. Make the error-route router argument optional for the TypeScript call shape.
5. Preserve the source `version.json` commit, branch, and build time when `git` is unavailable inside the builder (`0901818`).
6. Rebuild the full Compose stack and verify the public health contract against the exact deployed SHA.

## Timeline

1. A forced VPS deployment was initially blocked by uncommitted `backend/tsconfig.json`, generated `backend/version.json`, and test residue. The files were preserved before retrying.
2. The repaired `a12c9bd` image built and started; the public endpoint returned HTTP 200 and `db: "up"`, but release metadata was `unknown`.
3. The metadata fallback was committed as `0901818`, pushed, and redeployed.
4. Additional backend coverage commits landed on `prod` while deployment was in progress. The exact PR head `32139fb` was then deployed and verified.
5. PR #2 was reviewed and merged into `main` as `2555edd` using a head-SHA guard.

## Verification contract

For every future production backend deployment, record:

```bash
curl -sS -w '\nHTTP_STATUS:%{http_code}\n' https://akai-api.cjs.vn/health
ssh ubuntu@15.235.202.219 \
  'cd /opt/akaiunsan && git rev-parse HEAD && sudo docker inspect --format "{{.State.Health.Status}}" akaiunsan_backend'
```

The release is accepted only when:

- the public endpoint returns HTTP 200;
- `status` is `"ok"`;
- `db` is `"up"`;
- `git.commit` matches the VPS checkout and intended release SHA;
- `git.branch` is `"prod"`;
- `build.time` and `build.timeAgo` are present;
- `uptime` and `system` fields are present; and
- Docker reports `healthy` for `akaiunsan_backend`.

## Follow-ups

| Priority | Follow-up | Reason | Acceptance evidence |
|---|---|---|---|
| P1 | Make deploy metadata generation temporary or move it to an ignored build-input path | Prevent generated `backend/version.json` from blocking the next pull | Two consecutive deploys leave the VPS checkout clean without manual restore |
| P1 | Add a runtime smoke test to CI or deployment automation | A successful TypeScript command does not prove `dist/app.js` loads | CI/deploy starts the image and checks `/health` with expected SHA metadata |
| P2 | Replace `tsc || true` with an explicit diagnostic budget or complete the TypeScript migration | Current builds can succeed while emitting known semantic diagnostics | Typecheck policy is documented and enforced; no unreviewed diagnostics remain |
| P2 | Bound the VPS Git SSH connection in the deployment service | An outbound GitHub SSH hang can leave a deployment running indefinitely | Fetch/pull fails within a documented timeout and emits a useful log entry |

## What we will not claim

- A green build is not proof of a healthy public service.
- A source or merge SHA is not proof that the VPS or running image contains that SHA.
- A `status: "ok"` response with `git: "unknown"` is not complete release identity evidence.
- No customer-impact, request-volume, or data-integrity claim is valid without access-log and database evidence.
