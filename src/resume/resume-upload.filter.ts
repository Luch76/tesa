import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { RESUME_MAX_BYTES } from './resume.service.js';

/** Replaces multer's generic "File too large" with a message users can act on. */
@Catch(PayloadTooLargeException)
export class ResumeUploadFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost) {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.PAYLOAD_TOO_LARGE)
      .json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: `That file is larger than ${RESUME_MAX_BYTES / (1024 * 1024)} MB.`,
      });
  }
}
