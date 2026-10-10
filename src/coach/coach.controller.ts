import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { CoachService } from './coach.service.js';
import { Grade, parseCoachContext, SimulationReview } from './coach.types.js';

/** AI tutor and Practice Arena conversations for the web app (AI_MODEL). */
@Controller('api/coach')
export class CoachController {
  constructor(private readonly coach: CoachService) {}

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
