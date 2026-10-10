import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** Sends browsers to the login page; API clients get a plain 401. */
@Catch(UnauthorizedException)
export class UnauthorizedFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (req.method === 'GET' && req.accepts(['json', 'html']) === 'html') {
      res.redirect('/login');
      return;
    }
    res.status(exception.getStatus()).json(exception.getResponse());
  }
}
