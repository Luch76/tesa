import { readFileSync } from 'node:fs';
import { extractResumeText } from './text-extract.js';

const fixture = (name: string) =>
  readFileSync(new URL(`../../test/fixtures/${name}`, import.meta.url));

const DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

it.each([
  ['resume.pdf', 'application/pdf'],
  ['resume.docx', DOCX],
])('extracts text from %s', async (name, mimeType) => {
  const text = await extractResumeText(fixture(name), mimeType);
  expect(text).toContain('Ada Lovelace');
  expect(text).toContain(
    'Built weekly revenue dashboards in Excel with pivot tables',
  );
});

it('reads plain text', async () => {
  const text = await extractResumeText(
    Buffer.from('Ada Lovelace\r\nData Analyst with ten years of experience'),
    'text/plain; charset=utf-8',
  );
  expect(text).toBe('Ada Lovelace\nData Analyst with ten years of experience');
});

it('explains when a file has no readable text', async () => {
  await expect(
    extractResumeText(Buffer.from('   '), 'text/plain; charset=utf-8'),
  ).rejects.toThrow(/couldn't read any text/);
});

it('rejects legacy Word files', async () => {
  await expect(
    extractResumeText(Buffer.from('x'), 'application/msword'),
  ).rejects.toThrow(/PDF, DOCX or text/);
});
