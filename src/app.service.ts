import { Injectable } from '@nestjs/common';
import { loginView } from './views/login.view.js';

@Injectable()
export class AppService {
  getLogin(): string {
    return loginView();
  }
}
