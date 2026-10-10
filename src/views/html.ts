export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

const baseStyles = `
  :root {
    color-scheme: light dark;
    --bg: #f6f7f9;
    --surface: #ffffff;
    --text: #1f2328;
    --muted: #59636e;
    --border: #d8dee4;
    --accent: #0b6bcb;
    --accent-soft: #e6f0fb;
    --danger: #c62828;
    --radius: 14px;
    --tabbar-h: 64px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1216;
      --surface: #181c22;
      --text: #e6e9ed;
      --muted: #9aa4af;
      --border: #2b323b;
      --accent: #5aa7f0;
      --accent-soft: #1b2b3d;
      --danger: #ef6b6b;
    }
  }
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  body {
    margin: 0;
    min-height: 100vh;
    min-height: 100dvh;
    font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    -webkit-tap-highlight-color: transparent;
  }
  h1, h2, h3 { line-height: 1.25; margin: 0 0 0.5rem; }
  p { margin: 0 0 1rem; }
  a { color: var(--accent); }
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    width: 100%;
    min-height: 48px;
    padding: 0.75rem 1.25rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    touch-action: manipulation;
  }
  .button:active { transform: scale(0.98); }
  .button.danger { color: var(--danger); }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
`;

export const document = (
  title: string,
  body: string,
  styles = '',
) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f6f7f9" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0f1216" media="(prefers-color-scheme: dark)">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>${escapeHtml(title)}</title>
  <style>${baseStyles}${styles}</style>
</head>
<body>${body}</body>
</html>`;
