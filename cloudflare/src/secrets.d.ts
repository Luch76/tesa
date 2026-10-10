// Worker secrets (set with `wrangler secret put` or `wrangler deploy --secrets-file`).
// `wrangler types` only sees secrets listed in a local .dev.vars, so declare them here.
interface WorkerSecrets {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  // Optional: without them the coach uses the browser's built-in voice.
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
}
interface Env extends WorkerSecrets {}
declare namespace Cloudflare {
  interface Env extends WorkerSecrets {}
}
