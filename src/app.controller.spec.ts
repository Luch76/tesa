import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ResumeService } from './resume/resume.service.js';
import type { ResumeInfo } from './resume/resume.service.js';

const user = { id: '1', email: 'ada@example.com', name: '<Ada>' };

describe('AppController', () => {
  let appController: AppController;
  let resume: ResumeInfo | null;

  beforeEach(async () => {
    resume = null;
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: ResumeService, useValue: { find: () => resume } },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('renders all three tabs and marks the active one', async () => {
    const html = await appController.getResume(user, {});
    expect(html).toContain('href="/resume" aria-current="page"');
    expect(html).toContain('href="/socratic"');
    expect(html).toContain('href="/settings"');
    const nav = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it('prompts for a resume upload when none exists', async () => {
    const html = await appController.getResume(user, {});
    expect(html).toContain('enctype="multipart/form-data"');
    expect(html).toContain('name="resume"');
    expect(html).toContain('accept=".pdf,');
    expect(html).toContain('Upload resume');
  });

  it('shows the uploaded resume with view and remove actions', async () => {
    resume = {
      originalName: '<script>.pdf',
      mimeType: 'application/pdf',
      size: 250_000,
      uploadedAt: '2026-10-10T12:00:00.000Z',
    };
    const html = await appController.getResume(user, { uploaded: '1' });
    expect(html).toContain('&lt;script&gt;.pdf');
    expect(html).not.toContain('<script>.pdf');
    expect(html).toContain('PDF · 244 KB · Uploaded Oct 10, 2026');
    expect(html).toContain('href="/resume/file"');
    expect(html).toContain('action="/resume/delete"');
    expect(html).toContain('Resume uploaded.');
  });

  it('explains upload errors', async () => {
    const html = await appController.getResume(user, { error: 'too-large' });
    expect(html).toContain('role="alert"');
    expect(html).toContain('larger than 5 MB');
  });

  it('shows the escaped profile and a logout button on Settings', () => {
    const html = appController.getSettings(user);
    expect(html).toContain('&lt;Ada&gt;');
    expect(html).not.toContain('<Ada>');
    expect(html).toContain('action="/auth/logout"');
  });

  it('uses a mobile viewport', () => {
    expect(appController.getSocratic(user)).toContain('viewport-fit=cover');
  });

  it('shows a Login with Google link', () => {
    expect(appController.getLogin()).toContain('href="/auth/google"');
  });
});
