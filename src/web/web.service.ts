import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Location of the built React app (`web/dist/client`), served by main.ts and WebController. */
export const webDir = (config: { get(key: string): string | undefined }) =>
  resolve(config.get('WEB_DIR') ?? join('web', 'dist', 'client'));

@Injectable()
export class WebService {
  private readonly dir: string;
  private html?: string;

  constructor(config: ConfigService) {
    this.dir = webDir(config);
  }

  shell(): string {
    try {
      this.html ??= readFileSync(join(this.dir, '_shell.html'), 'utf8');
      return this.html;
    } catch {
      throw new ServiceUnavailableException(
        `Web app not built: run "npm run build" in web/ (looked in ${this.dir})`,
      );
    }
  }
}
