import {
  Container,
  getContainer,
  type OutboundHandlerContext,
} from '@cloudflare/containers';

// Required for the container's outbound requests to reach `outboundByHost` handlers.
export { ContainerProxy } from '@cloudflare/containers';

/** Made-up host the container uses for resume storage; requests to it never leave Cloudflare. */
const STORAGE_HOST = 'resumes.r2';

/** `<sha256 of user id>/<file name>`, as written by the app's ResumeService. */
const STORAGE_KEY = /^[0-9a-f]{64}\/[a-z0-9.]+$/;

/** Made-up host the container uses for AI chat completions (OpenAI-compatible). */
const AI_HOST = 'ai.internal';

/**
 * Forwards the app's chat completion requests to the model through AI Gateway, so
 * the container never holds AI credentials.
 */
async function aiChat(
  request: Request,
  env: Env,
  _ctx: OutboundHandlerContext,
): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (request.method !== 'POST' || pathname !== '/v1/chat/completions') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  const { model, ...input } = (await request.json()) as {
    model?: string;
  } & Record<string, unknown>;

  try {
    const result = (await env.AI.run(
      (model || env.AI_MODEL) as Parameters<Env['AI']['run']>[0],
      input as never,
      { gateway: { id: env.AI_GATEWAY_ID } },
    )) as unknown;
    return Response.json(toChatCompletion(result));
  } catch (err) {
    console.error('AI request failed', err);
    return Response.json(
      { error: (err as Error).message ?? String(err) },
      { status: 502 },
    );
  }
}

/** Accepts both the OpenAI shape and Workers AI's `{ response }` shape. */
function toChatCompletion(result: unknown): unknown {
  if (result && typeof result === 'object' && 'choices' in result) {
    return result;
  }
  const response = (result as { response?: unknown } | null)?.response;
  const content =
    typeof response === 'string' ? response : JSON.stringify(response ?? result);
  return { choices: [{ message: { role: 'assistant', content } }] };
}

/** Durable Object storage key for the hash of the settings the container started with. */
const CONFIG_KEY = 'configFingerprint';

/** Serves the app's object storage API (GET, PUT, DELETE) from the R2 bucket. */
async function resumeObjects(
  request: Request,
  env: Env,
  _ctx: OutboundHandlerContext,
): Promise<Response> {
  const key = decodeURIComponent(new URL(request.url).pathname.slice(1));
  if (!STORAGE_KEY.test(key)) {
    return new Response('Invalid key', { status: 400 });
  }

  switch (request.method) {
    case 'GET': {
      const object = await env.RESUMES.get(key);
      return object
        ? new Response(object.body, {
            headers: { 'Content-Type': object.httpMetadata?.contentType ?? '' },
          })
        : new Response('Not found', { status: 404 });
    }
    case 'PUT':
      await env.RESUMES.put(key, await request.arrayBuffer(), {
        httpMetadata: {
          contentType:
            request.headers.get('Content-Type') ?? 'application/octet-stream',
        },
      });
      return new Response(null, { status: 204 });
    case 'DELETE':
      await env.RESUMES.delete(key);
      return new Response(null, { status: 204 });
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

export class TesaApp extends Container<Env> {
  defaultPort = 3000;
  // Sleep after 15 idle minutes; the next request wakes it (a few seconds' cold start).
  sleepAfter = '15m';


  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    this.envVars = {
      NODE_ENV: 'production',
      PORT: '3000',
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL: env.GOOGLE_CALLBACK_URL,
      JWT_SECRET: env.JWT_SECRET,
      RESUME_STORAGE_URL: `http://${STORAGE_HOST}`,
      AI_BASE_URL: `http://${AI_HOST}/v1`,
      AI_MODEL: env.AI_MODEL,
    };
  }

  /**
   * A running container keeps the environment it started with. When secrets or vars
   * change, restart it on the next request so the new values take effect.
   */
  override async fetch(request: Request): Promise<Response> {
    const { status } = await this.getState();
    if (status === 'running' || status === 'healthy') {
      const startedWith = await this.ctx.storage.get<string>(CONFIG_KEY);
      if (startedWith !== (await this.configFingerprint())) {
        await this.destroy();
      }
    }
    return super.fetch(request);
  }

  override async onStart(): Promise<void> {
    await this.ctx.storage.put(CONFIG_KEY, await this.configFingerprint());
  }

  private async configFingerprint(): Promise<string> {
    const bytes = new TextEncoder().encode(JSON.stringify(this.envVars));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Assigned here rather than as a `static` class field: the field would shadow the
// library's setter, which is what registers the handler with the container proxy.
TesaApp.outboundByHost = {
  [STORAGE_HOST]: resumeObjects,
  [AI_HOST]: aiChat,
};

export default {
  // A single app instance serves every request; sessions are stateless JWT cookies.
  fetch(request, env) {
    return getContainer(env.APP).fetch(request);
  },
} satisfies ExportedHandler<Env>;
