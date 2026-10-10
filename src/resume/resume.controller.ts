import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import type { Profile } from '../analysis/profile.js';
import { ResumeAnalysisService } from '../analysis/resume-analysis.service.js';
import { extractResumeText } from '../analysis/text-extract.js';
import { ResumeUploadFilter } from './resume-upload.filter.js';
import {
  RESUME_MAX_BYTES,
  ResumeInfo,
  ResumeService,
} from './resume.service.js';

const MAX_PASTED_CHARS = 50_000;

/** JSON API for the signed-in user's resume, used by the web app. */
@Controller('api/resume')
export class ResumeController {
  constructor(
    private readonly resumes: ResumeService,
    private readonly analysis: ResumeAnalysisService,
  ) {}

  @Get()
  async get(
    @CurrentUser() user: AuthUser,
  ): Promise<{ resume: ResumeInfo | null; profile: Profile | null }> {
    const [resume, profile] = await Promise.all([
      this.resumes.find(user.id),
      this.resumes.findAnalysis(user.id),
    ]);
    return { resume, profile };
  }

  /**
   * Builds a skills profile from the user's saved resume, or from pasted text when
   * `text` is given. Analyses of the saved file are cached until it's replaced.
   */
  @Post('analyze')
  @HttpCode(200)
  async analyze(
    @CurrentUser() user: AuthUser,
    @Body() body: { text?: unknown } | undefined,
  ): Promise<{ profile: Profile }> {
    if (typeof body?.text === 'string' && body.text.trim()) {
      if (body.text.length > MAX_PASTED_CHARS) {
        throw new BadRequestException('That resume text is too long.');
      }
      return { profile: await this.analysis.analyze(body.text) };
    }

    const cached = await this.resumes.findAnalysis(user.id);
    if (cached) return { profile: cached };

    const resume = await this.resumes.read(user.id);
    if (!resume) {
      throw new BadRequestException('Add your resume first.');
    }
    const text = await extractResumeText(resume.data, resume.info.mimeType);
    const profile = await this.analysis.analyze(text);
    await this.resumes.saveAnalysis(user.id, resume.info, profile);
    return { profile };
  }

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
  ): Promise<{ resume: ResumeInfo }> {
    if (!file || file.size === 0) {
      throw new BadRequestException('Choose a file to upload');
    }
    return { resume: await this.resumes.save(user.id, file) };
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

  @Delete()
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser): Promise<void> {
    await this.resumes.remove(user.id);
  }
}
