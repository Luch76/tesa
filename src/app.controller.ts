import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service.js';
import { CurrentUser } from './auth/current-user.decorator.js';
import { Public } from './auth/public.decorator.js';
import type { AuthUser } from './auth/user.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getHome(@CurrentUser() user: AuthUser): string {
    return this.appService.getHome(user);
  }

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
