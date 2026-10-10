import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AUTH_COOKIE } from './auth.constants.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { GoogleAuthGuard } from './google-auth.guard.js';
import { Public } from './public.decorator.js';
import type { AuthUser } from './user.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Starts the Google sign-in flow (the guard redirects to Google). */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  google(): void {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const token = await this.auth.signToken(user);
    res.cookie(AUTH_COOKIE, token, this.auth.cookieOptions());
    res.redirect('/');
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  @Public()
  @Post('logout')
  logout(@Res() res: Response): void {
    const { maxAge: _maxAge, ...options } = this.auth.cookieOptions();
    res.clearCookie(AUTH_COOKIE, options);
    res.redirect(303, '/login');
  }
}
