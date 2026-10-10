import { Controller, Get, NotFoundException, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WebService } from './web.service.js';

/**
 * Serves the React app's HTML shell for every page route; the app's router takes over
 * in the browser. Requires a login, so signed-out visitors are sent to /login.
 * Registered last so the API, auth, login and health routes match first.
 */
@Controller()
export class WebController {
  constructor(private readonly web: WebService) {}

  @Get('{*path}')
  shell(@Req() req: Request, @Res() res: Response): void {
    if (/^\/(api|auth)(\/|$)/.test(req.path)) {
      throw new NotFoundException();
    }
    res.type('html').set('Cache-Control', 'no-cache').send(this.web.shell());
  }
}
