import { Module } from '@nestjs/common';
import { WebController } from './web.controller.js';
import { WebService } from './web.service.js';

@Module({
  controllers: [WebController],
  providers: [WebService],
})
export class WebModule {}
