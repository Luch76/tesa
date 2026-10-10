import type { AuthUser } from '../auth/user.js';
import { document, escapeHtml } from './html.js';
import { icons } from './icons.js';

export const TABS = [
  { id: 'resume', label: 'Resume', path: '/resume' },
  { id: 'socratic', label: 'Socratic Learning', path: '/socratic' },
  { id: 'settings', label: 'Settings', path: '/settings' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

const styles = `
  .app-header {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: calc(12px + env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
      12px max(16px, env(safe-area-inset-left));
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .app-header h1 { font-size: 1.25rem; margin: 0; }
  .app-header a { text-decoration: none; border-radius: 50%; }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex: none;
    display: grid;
    place-items: center;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 700;
    font-size: 0.875rem;
    object-fit: cover;
  }
  .content {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 20px max(16px, env(safe-area-inset-right))
      calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 24px) max(16px, env(safe-area-inset-left));
  }
  .tabbar {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 3;
    display: grid;
    grid-template-columns: repeat(${TABS.length}, 1fr);
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--surface);
    border-top: 1px solid var(--border);
  }
  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: var(--tabbar-h);
    padding: 6px 4px;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    text-decoration: none;
    touch-action: manipulation;
  }
  .tab[aria-current="page"] { color: var(--accent); }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
  .empty { text-align: center; padding: 2rem 1.25rem; }
  .empty .empty-icon {
    display: inline-grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    margin-bottom: 0.75rem;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .empty p, .muted { color: var(--muted); }
  .empty p:last-child { margin-bottom: 0; }
  .section-title {
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    margin: 1.5rem 0 0.5rem 0.25rem;
  }
  .profile { display: flex; align-items: center; gap: 1rem; }
  .profile .avatar { width: 56px; height: 56px; font-size: 1.25rem; }
  .profile-text { min-width: 0; }
  .profile-text strong, .profile-text span { display: block; overflow-wrap: anywhere; }
  .profile-text span { color: var(--muted); font-size: 0.9375rem; }
  .card form { margin: 0; }

  @media (min-width: 768px) {
    .app-header { position: static; }
    .tabbar {
      position: sticky;
      top: 0;
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      padding: 0 16px;
      border-top: 0;
      border-bottom: 1px solid var(--border);
    }
    .tab {
      flex-direction: row;
      gap: 0.5rem;
      min-height: 52px;
      padding: 0 1rem;
      font-size: 0.9375rem;
      border-bottom: 2px solid transparent;
    }
    .tab[aria-current="page"] { border-bottom-color: var(--accent); }
    .content { padding-bottom: 32px; }
  }
`;

const avatar = (user: AuthUser) =>
  user.picture
    ? `<img class="avatar" src="${escapeHtml(user.picture)}" alt="" referrerpolicy="no-referrer">`
    : `<span class="avatar" aria-hidden="true">${escapeHtml(user.name.charAt(0).toUpperCase())}</span>`;

const emptyState = (iconSvg: string, title: string, text: string) => `
  <section class="card empty">
    <span class="empty-icon">${iconSvg}</span>
    <h2>${title}</h2>
    <p>${text}</p>
  </section>`;

const panels: Record<TabId, (user: AuthUser) => string> = {
  resume: () =>
    emptyState(
      icons.resume,
      'Your resume',
      'Build and polish your resume here. Coming soon.',
    ),
  socratic: () =>
    emptyState(
      icons.socratic,
      'Socratic Learning',
      'Learn by working through guided questions instead of being handed answers. Coming soon.',
    ),
  settings: (user) => `
    <h2 class="section-title">Profile</h2>
    <section class="card profile">
      ${avatar(user)}
      <div class="profile-text">
        <strong>${escapeHtml(user.name)}</strong>
        <span>${escapeHtml(user.email)}</span>
      </div>
    </section>
    <h2 class="section-title">Account</h2>
    <section class="card">
      <form method="post" action="/auth/logout">
        <button class="button danger" type="submit">Log out</button>
      </form>
    </section>`,
};

export const tabView = (active: TabId, user: AuthUser) => {
  const tab = TABS.find((t) => t.id === active)!;
  const nav = TABS.map(
    (t) =>
      `<a class="tab" href="${t.path}"${t.id === active ? ' aria-current="page"' : ''}>${icons[t.id]}<span>${t.label}</span></a>`,
  ).join('');

  return document(
    `${tab.label} - tesa`,
    `<header class="app-header">
      <h1>${tab.label}</h1>
      <a href="/settings" aria-label="Settings">${avatar(user)}</a>
    </header>
    <nav class="tabbar" aria-label="Main">${nav}</nav>
    <main class="content">${panels[active](user)}</main>`,
    styles,
  );
};
