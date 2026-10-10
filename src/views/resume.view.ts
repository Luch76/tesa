import type { ResumeInfo } from '../resume/resume.service.js';
import { RESUME_ACCEPT, RESUME_MAX_BYTES } from '../resume/resume.service.js';
import { escapeHtml } from './html.js';
import { icons } from './icons.js';

export interface Flash {
  kind: 'success' | 'error';
  text: string;
}

export const resumeStyles = `
  .flash {
    border-radius: var(--radius);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }
  .flash.success { background: var(--success-soft); color: var(--success); }
  .flash.error { background: var(--danger-soft); color: var(--danger); }
  .upload { display: grid; gap: 1rem; margin: 0; }
  .dropzone {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 0.25rem;
    padding: 1.75rem 1rem;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    text-align: center;
    cursor: pointer;
  }
  .dropzone:focus-within { border-color: var(--accent); outline: 3px solid var(--accent-soft); }
  .dropzone.dragover { border-color: var(--accent); background: var(--accent-soft); }
  .dropzone.has-file { border-style: solid; border-color: var(--accent); }
  .dropzone input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  .dropzone strong { font-size: 1.0625rem; }
  .dropzone .hint { color: var(--muted); font-size: 0.9375rem; overflow-wrap: anywhere; }
  .dropzone .empty-icon { margin-bottom: 0.5rem; }
  .file-row { display: flex; align-items: center; gap: 0.875rem; }
  .file-row .empty-icon { width: 48px; height: 48px; margin: 0; flex: none; }
  .file-row div { min-width: 0; }
  .file-row strong { display: block; overflow-wrap: anywhere; }
  .file-row div span { color: var(--muted); font-size: 0.875rem; }
  .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.25rem; }
  .actions form { margin: 0; }
`;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const formatLabel = (mimeType: string) =>
  mimeType === 'application/pdf' ? 'PDF' : 'Word';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });

const maxMb = RESUME_MAX_BYTES / (1024 * 1024);

const uploadForm = (title: string, button: string) => `
  <form class="upload" method="post" action="/resume" enctype="multipart/form-data" data-upload>
    <label class="dropzone">
      <input type="file" name="resume" accept="${RESUME_ACCEPT}" required>
      <span class="empty-icon">${icons.upload}</span>
      <strong>${title}</strong>
      <span class="hint" data-hint>Tap to choose a file, or drop it here. PDF or Word, up to ${maxMb} MB.</span>
    </label>
    <button class="button primary" type="submit">${button}</button>
  </form>`;

/** Shows the chosen file before upload and catches oversized files early. */
const uploadScript = `<script>
  for (const form of document.querySelectorAll('[data-upload]')) {
    const input = form.querySelector('input[type=file]');
    const zone = form.querySelector('.dropzone');
    const hint = form.querySelector('[data-hint]');
    const button = form.querySelector('button');
    const original = hint.textContent;
    input.addEventListener('change', () => {
      const file = input.files[0];
      zone.classList.toggle('has-file', !!file);
      if (!file) { hint.textContent = original; button.disabled = false; return; }
      const tooBig = file.size > ${RESUME_MAX_BYTES};
      hint.textContent = tooBig ? file.name + ' is larger than ${maxMb} MB.' : file.name;
      button.disabled = tooBig;
    });
    for (const type of ['dragenter', 'dragover']) zone.addEventListener(type, () => zone.classList.add('dragover'));
    for (const type of ['dragleave', 'drop']) zone.addEventListener(type, () => zone.classList.remove('dragover'));
    form.addEventListener('submit', () => { button.disabled = true; button.textContent = 'Uploading…'; });
  }
</script>`;

export const resumePanel = (resume: ResumeInfo | null, flash?: Flash) => {
  const banner = flash
    ? `<p class="flash ${flash.kind}" role="${flash.kind === 'error' ? 'alert' : 'status'}">${escapeHtml(flash.text)}</p>`
    : '';

  if (!resume) {
    return `${banner}
      <section class="card">
        <h2>Upload your resume</h2>
        <p class="muted">Start by adding your current resume. You can replace it at any time.</p>
        ${uploadForm('Choose your resume', 'Upload resume')}
      </section>
      ${uploadScript}`;
  }

  return `${banner}
    <section class="card">
      <div class="file-row">
        <span class="empty-icon">${icons.resume}</span>
        <div>
          <strong>${escapeHtml(resume.originalName)}</strong>
          <span>${formatLabel(resume.mimeType)} · ${formatSize(resume.size)} · Uploaded ${formatDate(resume.uploadedAt)}</span>
        </div>
      </div>
      <div class="actions">
        <a class="button" href="/resume/file" target="_blank" rel="noopener">View</a>
        <form method="post" action="/resume/delete">
          <button class="button danger" type="submit">Remove</button>
        </form>
      </div>
    </section>
    <section class="card">
      <h2>Replace your resume</h2>
      ${uploadForm('Choose a new file', 'Replace resume')}
    </section>
    ${uploadScript}`;
};
