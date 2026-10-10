import { Injectable } from '@nestjs/common';
import type { AuthUser } from './auth/user.js';
import { ResumeService } from './resume/resume.service.js';
import { loginView } from './views/login.view.js';
import type { Flash } from './views/resume.view.js';
import { TabId, tabView } from './views/tabs.view.js';

const RESUME_FLASH: Record<string, Flash> = {
  uploaded: { kind: 'success', text: 'Resume uploaded.' },
  removed: { kind: 'success', text: 'Resume removed.' },
  'too-large': { kind: 'error', text: 'That file is larger than 5 MB.' },
  type: {
    kind: 'error',
    text: "That file isn't a PDF or Word document. Upload a .pdf, .doc or .docx file.",
  },
  missing: { kind: 'error', text: 'Choose a file to upload.' },
};

export interface ResumeQuery {
  uploaded?: string;
  removed?: string;
  error?: string;
}

@Injectable()
export class AppService {
  constructor(private readonly resumes: ResumeService) {}

  getTab(tab: Exclude<TabId, 'resume'>, user: AuthUser): string {
    return tabView(tab, { user });
  }

  async getResumeTab(user: AuthUser, query: ResumeQuery): Promise<string> {
    const key =
      query.error ??
      (query.uploaded ? 'uploaded' : query.removed ? 'removed' : undefined);
    return tabView('resume', {
      user,
      resume: await this.resumes.find(user.id),
      flash: key ? RESUME_FLASH[key] : undefined,
    });
  }

  getLogin(): string {
    return loginView();
  }
}
