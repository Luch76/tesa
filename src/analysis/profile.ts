import { SKILLS } from './skills.js';

/** The web app's Profile type (web/src/lib/tesa/data.ts). */
export interface Profile {
  name: string;
  headline: string;
  years: number;
  languages: string[];
  skills: Record<string, { level: number; evidence: string }>;
}

const KNOWN_SKILLS = new Set<string>(SKILLS);

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

const text = (value: unknown, max: number) =>
  typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().slice(0, max)
    : '';

/**
 * Turns the model's JSON into a Profile, keeping only what the resume supports:
 * known skills, whole levels from 1 to 6, and evidence quoted from the resume itself.
 */
export function toProfile(raw: unknown, resumeText: string): Profile {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  const resume = normalize(resumeText);

  const skills: Profile['skills'] = {};
  for (const item of Array.isArray(data.skills) ? data.skills : []) {
    if (!item || typeof item !== 'object') continue;
    const { skill, level, evidence } = item as Record<string, unknown>;
    if (typeof skill !== 'string' || !KNOWN_SKILLS.has(skill)) continue;
    const quote = text(evidence, 200).replace(/^["'“”]+|["'“”.]+$/g, '');
    if (!quote || !resume.includes(normalize(quote))) continue;
    const lvl = Math.round(Number(level));
    if (!Number.isFinite(lvl) || lvl < 1) continue;
    const entry = { level: Math.min(6, lvl), evidence: quote };
    if (!skills[skill] || skills[skill].level < entry.level) {
      skills[skill] = entry;
    }
  }

  const years = Math.round(Number(data.years));
  return {
    name: text(data.name, 80),
    headline: text(data.headline, 80),
    years: Number.isFinite(years) ? Math.min(60, Math.max(0, years)) : 0,
    languages: (Array.isArray(data.languages) ? data.languages : [])
      .map((l) => text(l, 30))
      .filter(Boolean)
      .slice(0, 6),
    skills,
  };
}

/** Parses JSON from a model reply, tolerating a ```json fence around it. */
export function parseModelJson(reply: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(reply);
  const body = (fenced?.[1] ?? reply).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON object in reply');
  return JSON.parse(body.slice(start, end + 1));
}
