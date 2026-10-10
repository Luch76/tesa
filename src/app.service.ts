import { Injectable } from '@nestjs/common';
import type { AuthUser } from './auth/user.js';
import { loginView } from './views/login.view.js';
import { TabId, tabView } from './views/tabs.view.js';

@Injectable()
export class AppService {
  getTab(tab: TabId, user: AuthUser): string {
    return tabView(tab, user);
  }

  getLogin(): string {
    return loginView();
  }
}
