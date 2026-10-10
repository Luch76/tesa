import { Injectable } from '@nestjs/common';
import type { AuthUser } from './auth/user.js';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

const page = (title: string, body: string) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f6f7f9; color: #1f2328; }
    main { background: #fff; padding: 2rem 2.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.1); text-align: center; }
    a.button, button { display: inline-block; padding: 0.6rem 1.2rem; border-radius: 6px; border: 1px solid #d0d7de; background: #fff; color: inherit; font: inherit; text-decoration: none; cursor: pointer; }
    img { border-radius: 50%; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;

@Injectable()
export class AppService {
  getHome(user: AuthUser): string {
    const picture = user.picture
      ? `<img src="${escapeHtml(user.picture)}" alt="" width="64" height="64" referrerpolicy="no-referrer">`
      : '';
    return page(
      'tesa',
      `${picture}
      <h1>Hello, ${escapeHtml(user.name)}!</h1>
      <p>Signed in as ${escapeHtml(user.email)}</p>
      <form method="post" action="/auth/logout"><button type="submit">Log out</button></form>`,
    );
  }

  getLogin(): string {
    return page(
      'Sign in - tesa',
      `<h1>tesa</h1>
      <p>Sign in to continue.</p>
      <a class="button" href="/auth/google">Login with Google</a>`,
    );
  }
}
