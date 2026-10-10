import { document } from './html.js';
import { icons } from './icons.js';

const styles = `
  body {
    display: grid;
    place-items: center;
    padding: max(24px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
      max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  }
  .card {
    width: 100%;
    max-width: 400px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 2rem 1.5rem;
    text-align: center;
  }
  .card h1 { font-size: 1.75rem; }
  .card p { color: var(--muted); margin-bottom: 1.5rem; }
`;

export const loginView = () =>
  document(
    'Sign in - tesa',
    `<main class="card">
      <h1>tesa</h1>
      <p>Sign in to continue.</p>
      <a class="button" href="/auth/google">${icons.google}<span>Login with Google</span></a>
    </main>`,
    styles,
  );
