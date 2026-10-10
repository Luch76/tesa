# tesa

A [NestJS](https://nestjs.com/) (TypeScript) web app for Hack for Humanity Miami. Event info, challenges and rules are in [docs/README.md](docs/README.md).

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (for container builds)

## Develop

```bash
npm install
npm run start:dev      # http://localhost:3000, reloads on change
```

Endpoints:

- `GET /` returns `Hello World!`
- `GET /health` returns `{"status":"ok"}`

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
npm run docker:run     # docker run --rm -p 3000:3000 tesa
# or
docker compose up --build
```

The image is a multi-stage `node:22-alpine` build that runs as the non-root `node` user and has a health check on `/health`.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Port the server listens on |
