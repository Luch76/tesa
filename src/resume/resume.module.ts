import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { ResumeAnalysisService } from '../analysis/resume-analysis.service.js';
import { ResumeController } from './resume.controller.js';
import { ResumeService } from './resume.service.js';

@Module({
  imports: [AiModule],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeAnalysisService],
  exports: [ResumeService],
})
export class ResumeModule {}
