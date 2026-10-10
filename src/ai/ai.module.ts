import { Module } from '@nestjs/common';
import { AiClient } from './ai.client.js';

/** The chat model client (AI_BASE_URL / AI_MODEL), shared by resume analysis and the coach. */
@Module({
  providers: [AiClient],
  exports: [AiClient],
})
export class AiModule {}
