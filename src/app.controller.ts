import { Controller, Get, Header, Query, Redirect } from '@nestjs/common';
import { AppService, type ResumeQuery } from './app.service.js';
import { CurrentUser } from './auth/current-user.decorator.js';
import { Public } from './auth/public.decorator.js';
import type { AuthUser } from './auth/user.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** The main screen opens on its first tab. */
  @Get()
  @Redirect('/resume')
  getHome(): void {}

  @Get('resume')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getResume(
    @CurrentUser() user: AuthUser,
    @Query() query: ResumeQuery,
  ): Promise<string> {
    return this.appService.getResumeTab(user, query);
  }

  @Get('socratic')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getSocratic(@CurrentUser() user: AuthUser): string {
    return this.appService.getTab('socratic', user);
  }

  @Get('settings')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getSettings(@CurrentUser() user: AuthUser): string {
    return this.appService.getTab('settings', user);
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
