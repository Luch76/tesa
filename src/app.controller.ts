import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './auth/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('login')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLogin(): string {
    return this.appService.getLogin();
  }

  @Public()
  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
