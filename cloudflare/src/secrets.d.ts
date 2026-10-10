// Worker secrets (set with `wrangler secret put` or `wrangler deploy --secrets-file`).
// `wrangler types` only sees secrets listed in a local .dev.vars, so declare them here.
interface WorkerSecrets {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
}
interface Env extends WorkerSecrets {}
declare namespace Cloudflare {
  interface Env extends WorkerSecrets {}
}
