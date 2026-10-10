import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';

export type UploadError = 'too-large' | 'type' | 'missing';

/** Turns upload failures into a redirect back to the Resume tab with a message. */
@Catch(HttpException)
export class ResumeUploadFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof UnauthorizedException) {
      res.status(exception.getStatus()).json(exception.getResponse());
      return;
    }
    const error: UploadError =
      exception.getStatus() === HttpStatus.PAYLOAD_TOO_LARGE
        ? 'too-large'
        : exception.getStatus() === HttpStatus.UNSUPPORTED_MEDIA_TYPE
          ? 'type'
          : 'missing';
    res.redirect(303, `/resume?error=${error}`);
  }
}
