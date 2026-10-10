import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions } from 'express';
import type { AuthUser } from './user.js';

export function jwtExpiresInSeconds(config: ConfigService): number {
  return Number(config.get<string>('JWT_EXPIRES_IN_SECONDS') ?? 86400);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signToken(user: AuthUser): Promise<string> {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  }

  cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      // Only mark the cookie Secure when the app is served over HTTPS.
      secure: this.config
        .getOrThrow<string>('GOOGLE_CALLBACK_URL')
        .startsWith('https://'),
      maxAge: jwtExpiresInSeconds(this.config) * 1000,
      path: '/',
    };
  }
}
