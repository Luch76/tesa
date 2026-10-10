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

  it('shows a Login with Google link on a mobile-ready page', () => {
    const html = appController.getLogin();
    expect(html).toContain('href="/auth/google"');
    expect(html).toContain('viewport-fit=cover');
  });

  it('reports health', () => {
    expect(appController.getHealth()).toEqual({ status: 'ok' });
  });
});
