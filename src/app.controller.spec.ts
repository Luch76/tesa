import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

const user = { id: '1', email: 'ada@example.com', name: '<Ada>' };

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('renders all three tabs and marks the active one', () => {
    const html = appController.getResume(user);
    expect(html).toContain('href="/resume" aria-current="page"');
    expect(html).toContain('href="/socratic"');
    expect(html).toContain('href="/settings"');
    const nav = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'));
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
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
