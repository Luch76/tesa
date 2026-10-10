import { Module } from '@nestjs/common';
import { AiClient } from '../analysis/ai.client.js';
import { ResumeAnalysisService } from '../analysis/resume-analysis.service.js';
import { ResumeController } from './resume.controller.js';
import { ResumeService } from './resume.service.js';

@Module({
  controllers: [ResumeController],
  providers: [ResumeService, ResumeAnalysisService, AiClient],
  exports: [ResumeService],
})
export class ResumeModule {}
