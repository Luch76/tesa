import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const DEFAULT_AI_MODEL = 'google/gemini-3.8-flash';

/**
 * Calls an OpenAI-compatible chat completions API.
 * On Cloudflare, AI_BASE_URL points at the Worker, which forwards to Gemini through AI Gateway.
 * Locally it can point at Cloudflare's REST endpoint with AI_API_TOKEN.
 */
@Injectable()
export class AiClient {
  private readonly baseUrl?: string;
  private readonly token?: string;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('AI_BASE_URL')?.replace(/\/+$/, '');
    this.token = config.get<string>('AI_API_TOKEN') || undefined;
    this.model = config.get<string>('AI_MODEL') || DEFAULT_AI_MODEL;
  }

  async completeJson(messages: ChatMessage[]): Promise<string> {
    if (!this.baseUrl) {
      throw new ServiceUnavailableException(
        'Resume analysis is not configured on this server (AI_BASE_URL is not set).',
      );
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (err) {
      throw new ServiceUnavailableException(
        `The AI service could not be reached: ${(err as Error).message}`,
      );
    }

    const body = (await res.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
      error?: unknown;
      errors?: unknown;
    } | null;
    const content = body?.choices?.[0]?.message?.content;
    if (!res.ok || typeof content !== 'string') {
      const detail = JSON.stringify(body?.error ?? body?.errors ?? body) ?? '';
      throw new ServiceUnavailableException(
        `The AI service returned an error (${res.status}): ${detail.slice(0, 300)}`,
      );
    }
    return content;
  }
}
