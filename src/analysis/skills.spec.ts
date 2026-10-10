import { readFileSync } from 'node:fs';
import { BLOOM, SKILLS } from './skills.js';

// The web app scores job fit against these names, so the lists must match exactly.
const webData = readFileSync(
  new URL('../../web/src/lib/tesa/data.ts', import.meta.url),
  'utf8',
);

const listIn = (name: string) => {
  const match = new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\];`).exec(
    webData,
  );
  return [...(match?.[1] ?? '').matchAll(/"([^"]+)"/g)].map((m) => m[1]);
};

it('matches the web app skill list', () => {
  expect([...SKILLS]).toEqual(listIn('SKILLS'));
});

it('matches the web app Bloom levels', () => {
  expect([...BLOOM]).toEqual(listIn('BLOOM'));
});
