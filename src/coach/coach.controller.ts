import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CoachService } from './coach.service.js';
import { Grade, parseCoachContext, SimulationReview } from './coach.types.js';
import { MAX_SPEECH_CHARS, SpeechService } from './speech.service.js';

/** AI tutor and Practice Arena conversations for the web app (AI_MODEL). */
@Controller('api/coach')
export class CoachController {
  constructor(
    private readonly coach: CoachService,
    private readonly speech: SpeechService,
  ) {}

  /** Whether replies can be spoken with the ElevenLabs voice. */
  @Get('speech')
  speechConfig(): { enabled: boolean } {
    return { enabled: this.speech.enabled };
  }

  /** The coach's reply as MP3 audio in the configured ElevenLabs voice. */
  @Post('speech')
  @HttpCode(200)
  async speak(
    @Body() body: { text?: unknown } | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const text =
      typeof body?.text === 'string'
        ? body.text.replace(/\s+/g, ' ').trim()
        : '';
    if (!text) throw new BadRequestException('Nothing to say.');
    if (text.length > MAX_SPEECH_CHARS) {
      throw new BadRequestException('That reply is too long to speak.');
    }
    const audio = await this.speech.synthesize(text);
    res
      .set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' })
      .send(audio);
  }

  @Post('turn')
  @HttpCode(200)
  turn(@Body() body: unknown): Promise<{ reply: string; grade?: Grade }> {
    const ctx = parseCoachContext(body);
    if (ctx.turns.at(-1)?.role !== 'user' || !ctx.turns.at(-1)?.text) {
      throw new BadRequestException(
        'The conversation must end with your answer.',
      );
    }
    return this.coach.turn(ctx);
  }

  @Post('review')
  @HttpCode(200)
  review(@Body() body: unknown): Promise<SimulationReview> {
    const ctx = parseCoachContext({ ...(body as object), mode: 'simulation' });
    if (!ctx.turns.some((t) => t.role === 'user' && t.text)) {
      throw new BadRequestException('There is nothing to review yet.');
    }
    return this.coach.review(ctx);
  }
}
