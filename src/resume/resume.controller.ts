import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { create as contentDisposition } from 'content-disposition';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/user.js';
import { ResumeUploadFilter } from './resume-upload.filter.js';
import { RESUME_MAX_BYTES, ResumeService } from './resume.service.js';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumes: ResumeService) {}

  @Post()
  @UseFilters(ResumeUploadFilter)
  @UseInterceptors(
    FileInterceptor('resume', {
      limits: { fileSize: RESUME_MAX_BYTES, files: 1 },
      defParamCharset: 'utf8',
    }),
  )
  async upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (!file || file.size === 0) {
      throw new BadRequestException('Choose a file to upload');
    }
    await this.resumes.save(user.id, file);
    res.redirect(303, '/resume?uploaded=1');
  }

  @Get('file')
  async download(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const resume = await this.resumes.read(user.id);
    if (!resume) throw new NotFoundException('No resume uploaded');
    const { info, data } = resume;
    res
      .set({
        'Content-Type': info.mimeType,
        'Content-Disposition': contentDisposition(info.originalName, {
          type: info.mimeType === 'application/pdf' ? 'inline' : 'attachment',
        }),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(data);
  }

  @Post('delete')
  async remove(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    await this.resumes.remove(user.id);
    res.redirect(303, '/resume?removed=1');
  }
}
