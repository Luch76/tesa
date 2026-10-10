import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('greets the signed-in user and escapes their name', () => {
    const html = appController.getHome({
      id: '1',
      email: 'ada@example.com',
      name: '<Ada>',
    });
    expect(html).toContain('Hello, &lt;Ada&gt;!');
    expect(html).toContain('ada@example.com');
  });

  it('shows a Login with Google link', () => {
    expect(appController.getLogin()).toContain('href="/auth/google"');
  });
});
