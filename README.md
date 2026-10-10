# tesa

TESA Miami, a career-readiness web app for Hack for Humanity Miami. Event info, challenges and rules are in [docs/README.md](docs/README.md).

The repo has two parts:

- **`web/`**: the user interface, a React app built with [TanStack Start](https://tanstack.com/start) (originally generated with Lovable). It is built as a static single-page app and is currently a prototype: profile journey, Miami jobs, skill gap, personal coach and Socratic tutor, Practice Arena and proof portfolio, with demo data and progress saved in the browser.
- **root (`src/`)**: a [NestJS](https://nestjs.com/) server that handles Google login, serves the built web app behind it, and provides the `/api` routes (resume storage).

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (for container builds)

## Develop

```bash
cp .env.example .env   # then fill in the Google credentials (see below)
npm install
(cd web && npm install && npm run build)
npm run start:dev      # http://localhost:3000, reloads on server changes
```

To work on the UI with hot reload, keep the server running and start Vite as well:

```bash
cd web && npm run dev  # proxies /api and /auth to the server on :3000
```

Sign in once at http://localhost:3000 first; the session cookie then works for the Vite dev server too.

Routes:

| Route | Auth | Description |
| --- | --- | --- |
| `GET /`, `/jobs`, `/gap`, `/coach`, `/simulations`, `/portfolio` | required | The web app (any other page path also serves it) |
| `GET /login` | public | Login page with the "Login with Google" button |
| `GET /auth/google` | public | Starts Google sign-in |
| `GET /auth/google/callback` | public | Google redirects here after sign-in |
| `GET /auth/me` | required | The signed-in user as JSON |
| `POST /auth/logout` | public | Clears the session cookie |
| `GET /api/resume` | required | The signed-in user's saved resume details, or `null` |
| `POST /api/resume` | required | Upload a resume (multipart field `resume`) |
| `GET /api/resume/file` | required | Download the signed-in user's resume |
| `DELETE /api/resume` | required | Remove the signed-in user's resume |
| `POST /api/coach/turn` | required | AI tutor's next question and grade of the learner's answer, or the Practice Arena customer's reply |
| `POST /api/coach/review` | required | AI soft-skill scores, summary and tips for a finished simulation |
| `POST /api/resume/analyze` | required | Build a skills profile from the saved resume with AI (or from `{"text": ...}`) |
| `GET /health` | public | Returns `{"status":"ok"}` |

Every route requires a login unless it is marked `@Public()`. Browsers without a session are redirected to `/login`; API clients get a `401`. The web app's built scripts, styles and images are public; its HTML is not.

In the web app, the account menu (top right) shows the Google user and has Log out. Adding a resume file on the profile page also saves it to the server.

## Resume analysis

"Analyze my resume" on the profile page sends the saved resume (PDF, DOCX or text) to `POST /api/resume/analyze`. The server extracts its text and asks Gemini for the web app's profile: name, headline, years of experience, languages, and a Bloom level (1 to 6) with a quoted piece of evidence for each of the app's 24 job skills. The server then keeps only known skills and evidence that appears word for word in the resume, so job-fit scores rest on what the resume actually says. Scoring itself stays deterministic in the web app. Results are cached until the resume is replaced.

The model is called through an OpenAI-compatible chat completions API at `AI_BASE_URL`. On Cloudflare that is the Worker, which forwards to Gemini through AI Gateway; without `AI_BASE_URL`, analysis returns a "not configured" error. "Try a sample resume" still loads the built-in sample profile.

## AI coach

The personal coach's Socratic tutor and the Practice Arena use the same model (`AI_MODEL`). In the tutor, the AI asks the next question and grades each answer with a Bloom level (1 to 6), a confidence and a quote from the answer; those grades are the evidence that raises skill levels and job-fit scores. In the Practice Arena, the AI plays the customer and, at the end, scores communication, empathy, problem solving, composure and professionalism from 1 to 5 with a summary and three tips. The server clamps every number to its range and replaces any quote that isn't word for word from the learner.

## Login with Google

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure the OAuth consent screen, then create an **OAuth client ID** of type **Web application**.
2. Add `http://localhost:3000/auth/google/callback` as an **Authorized redirect URI** (add your deployed URL's callback too, when you have one).
3. Put the client ID and secret in `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
4. Set `JWT_SECRET` to a random value, e.g. `openssl rand -hex 32`.

After Google sign-in, the app stores a signed JWT in an HTTP-only `access_token` cookie.

## Test and lint

```bash
npm test               # server unit tests (Vitest)
npm run test:e2e       # server end-to-end tests
npm run lint           # oxlint
cd web && npm test && npm run lint && npx tsc --noEmit   # web app
```

## Build

```bash
(cd web && npm run build)   # web app to web/dist/client
npm run build               # server to dist/
npm run start:prod
```

## Docker

```bash
npm run docker:build   # docker build -t tesa .
npm run docker:run     # docker run --rm -p 3000:3000 --env-file .env tesa
# or
docker compose up --build
```

The image is a multi-stage `node:22-alpine` build (web app, then server) that runs as the non-root `node` user and has a health check on `/health`. Docker Compose keeps uploaded resumes on the `app-data` volume, so they survive rebuilds; `docker compose down -v` deletes them.

## Resume uploads

Each user has one resume (uploading again replaces it). PDF, DOC, DOCX and plain-text files up to 5 MB are accepted; the type is checked from the file's contents, not just its extension. Files are stored under `UPLOAD_DIR` in a folder named after a hash of the user's Google ID, so other users can't reach them.

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
- Resume analysis uses the Worker's AI binding: `AI_MODEL` (default `google/gemini-2.5-flash`) through the AI Gateway `AI_GATEWAY_ID` (default `default`), vars in `cloudflare/wrangler.jsonc`. Third-party models need AI Gateway [Unified Billing](https://developers.cloudflare.com/ai-gateway/features/unified-billing/): the account must have AI Gateway credits loaded.
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
| `WEB_DIR` | `./web/dist/client` | The built web app to serve |
| `AI_BASE_URL` | (unset) | OpenAI-compatible API for resume analysis; unset turns analysis off |
| `AI_API_TOKEN` | (unset) | Bearer token for `AI_BASE_URL`, if it needs one |
| `AI_MODEL` | `google/gemini-2.5-flash` | Model for resume analysis and the AI coach |
| `RESUME_STORAGE_URL` | (unset) | If set, store resumes through this HTTP object API instead of `UPLOAD_DIR` (used on Cloudflare) |

Values are read from the environment, and from `.env` when present. Docker Compose passes `.env` to the container; it is never baked into the image.
