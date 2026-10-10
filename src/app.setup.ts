import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { webDir } from './web/web.service.js';

/** Express-level setup shared by main.ts and the e2e tests. */
export function setupApp(app: NestExpressApplication): void {
  app.use(cookieParser());
  // The React app's scripts, styles and images. They hold no user data, so they are
  // public; the HTML shell itself is served by WebController behind the login.
  app.useStaticAssets(webDir(app.get(ConfigService)), {
    index: false,
    setHeaders: (res, path) => {
      if (path.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  });
}
