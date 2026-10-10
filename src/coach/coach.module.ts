import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { CoachController } from './coach.controller.js';
import { CoachService } from './coach.service.js';

@Module({
  imports: [AiModule],
  controllers: [CoachController],
  providers: [CoachService],
})
export class CoachModule {}
