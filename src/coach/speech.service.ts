import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const DEFAULT_ELEVENLABS_MODEL = 'eleven_flash_v2_5';
export const MAX_SPEECH_CHARS = 2000;

/** Turns the coach's replies into speech with ElevenLabs, keeping the API key on the server. */
@Injectable()
export class SpeechService {
  private readonly apiKey?: string;
  private readonly voiceId?: string;
  private readonly modelId: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('ELEVENLABS_API_KEY') || undefined;
    this.voiceId = config.get<string>('ELEVENLABS_VOICE_ID') || undefined;
    this.modelId =
      config.get<string>('ELEVENLABS_MODEL_ID') || DEFAULT_ELEVENLABS_MODEL;
    this.baseUrl = (
      config.get<string>('ELEVENLABS_BASE_URL') || 'https://api.elevenlabs.io'
    ).replace(/\/+$/, '');
  }

  get enabled(): boolean {
    return Boolean(this.apiKey && this.voiceId);
  }

  /** MP3 audio of `text` in the configured voice. */
  async synthesize(text: string): Promise<Buffer> {
    if (!this.apiKey || !this.voiceId) {
      throw new ServiceUnavailableException(
        'The ElevenLabs voice is not configured on this server.',
      );
    }
    let res: Response;
    try {
      res = await fetch(
        `${this.baseUrl}/v1/text-to-speech/${encodeURIComponent(this.voiceId)}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({ text, model_id: this.modelId }),
          signal: AbortSignal.timeout(30_000),
        },
      );
    } catch (err) {
      throw new BadGatewayException(
        `ElevenLabs could not be reached: ${(err as Error).message}`,
      );
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        detail?: { message?: string } | string;
      } | null;
      const detail =
        typeof body?.detail === 'string' ? body.detail : body?.detail?.message;
      throw new BadGatewayException(
        `ElevenLabs returned an error (${res.status})${detail ? `: ${detail}` : ''}`,
      );
    }
    return Buffer.from(await res.arrayBuffer());
  }
}
