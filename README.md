# tesa

A [NestJS](https://nestjs.com/) (TypeScript) web app for Hack for Humanity Miami. Event info, challenges and rules are in [docs/README.md](docs/README.md).

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (for container builds)

## Develop

```bash
cp .env.example .env   # then fill in the Google credentials (see below)
npm install
npm run start:dev      # http://localhost:3000, reloads on change
```

Endpoints:

| Route | Auth | Description |
| --- | --- | --- |
| `GET /` | required | Redirects to the first tab (`/resume`) |
| `GET /resume` | required | Resume tab: upload, view, replace or remove your resume |
| `POST /resume` | required | Upload a resume (multipart field `resume`) |
| `GET /resume/file` | required | The signed-in user's resume |
| `POST /resume/delete` | required | Remove the signed-in user's resume |
| `GET /socratic` | required | Socratic Learning tab |
| `GET /settings` | required | Settings tab: profile and log out |
| `GET /login` | public | Login page with the "Login with Google" button |
| `GET /auth/google` | public | Starts Google sign-in |
| `GET /auth/google/callback` | public | Google redirects here after sign-in |
| `GET /auth/me` | required | The signed-in user as JSON |
| `POST /auth/logout` | public | Clears the session cookie |
| `GET /health` | public | Returns `{"status":"ok"}` |

The signed-in screens are mobile-first: a bottom tab bar on phones (respecting safe areas and notches) that becomes a top tab bar from 768px wide, with light and dark themes. Views live in `src/views/`.

Every route requires a login unless it is marked `@Public()`. Browsers without a session are redirected to `/login`; API clients get a `401`.

## Login with Google

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure the OAuth consent screen, then create an **OAuth client ID** of type **Web application**.
2. Add `http://localhost:3000/auth/google/callback` as an **Authorized redirect URI** (add your deployed URL's callback too, when you have one).
3. Put the client ID and secret in `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
4. Set `JWT_SECRET` to a random value, e.g. `openssl rand -hex 32`.

After Google sign-in, the app stores a signed JWT in an HTTP-only `access_token` cookie.

## Test and lint

```bash
npm test               # unit tests (Vitest)
npm run test:e2e       # end-to-end tests
npm run lint           # oxlint
```

## Build

```bash
npm run build          # compiles to dist/
npm run start:prod
```

## Docker

```bash
npm run docker:build   # docker build -t tesa .
npm run docker:run     # docker run --rm -p 3000:3000 --env-file .env tesa
# or
docker compose up --build
```

The image is a multi-stage `node:22-alpine` build that runs as the non-root `node` user and has a health check on `/health`. Docker Compose keeps uploaded resumes on the `app-data` volume, so they survive rebuilds; `docker compose down -v` deletes them.

## Resume uploads

Each user has one resume (uploading again replaces it). PDF, DOC and DOCX files up to 5 MB are accepted; the type is checked from the file's contents, not just its extension. Files are stored under `UPLOAD_DIR` in a folder named after a hash of the user's Google ID, so other users can't reach them.

## Deploy to Cloudflare

Production runs at **https://tesa.micahberkley.workers.dev** as a [Cloudflare Container](https://developers.cloudflare.com/containers/): `wrangler` builds the repo's `Dockerfile` (for `linux/amd64`), and a small Worker in `cloudflare/` sends every request to a single app instance. The instance sleeps after 15 idle minutes; the next request wakes it in a few seconds.

Container disks are temporary, so resumes live in the R2 bucket `tesa-resumes`. The app sets `RESUME_STORAGE_URL=http://resumes.r2`; the Worker answers those requests with its R2 binding, so no R2 keys are needed.

Requirements: Docker running locally, and `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` in `.env` (Workers Paid plan; token with Workers Scripts, Containers and Workers R2 Storage edit permissions).

```bash
cd cloudflare
npm install
set -a; eval "$(grep -E '^CLOUDFLARE_(API_TOKEN|ACCOUNT_ID)=' ../.env)"; set +a
npx wrangler deploy --containers-rollout immediate
```

Configuration:

- `GOOGLE_CALLBACK_URL` is a var in `cloudflare/wrangler.jsonc`. It must also be an authorized redirect URI on the Google OAuth client.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `JWT_SECRET` are Worker secrets. Update them with `npx wrangler deploy --secrets-file <file>` (or `npx wrangler secret put <NAME>`).
- A running container keeps the environment it started with. The Worker restarts it when the configuration changes, but this can lag by a few minutes; at the latest it applies after the next idle sleep.
- Logs: `npx wrangler tail`.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Port the server listens on |
| `GOOGLE_CLIENT_ID` | (required) | OAuth client ID from Google Cloud |
| `GOOGLE_CLIENT_SECRET` | (required) | OAuth client secret from Google Cloud |
| `GOOGLE_CALLBACK_URL` | (required) | Must match an authorized redirect URI on the client. If it starts with `https://`, the cookie is marked `Secure` |
| `JWT_SECRET` | (required) | Secret that signs session tokens |
| `JWT_EXPIRES_IN_SECONDS` | `86400` | How long a login lasts |
| `UPLOAD_DIR` | `./data/uploads` | Where uploaded resumes are stored (local disk) |
| `RESUME_STORAGE_URL` | (unset) | If set, store resumes through this HTTP object API instead of `UPLOAD_DIR` (used on Cloudflare) |

Values are read from the environment, and from `.env` when present. Docker Compose passes `.env` to the container; it is never baked into the image.
