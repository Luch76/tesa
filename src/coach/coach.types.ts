import { BadRequestException } from '@nestjs/common';
import { SKILLS } from '../analysis/skills.js';

export const SOFT_SKILLS = [
  'communication',
  'empathy',
  'problem_solving',
  'composure',
  'professionalism',
] as const;
export type SoftSkill = (typeof SOFT_SKILLS)[number];

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** What the web app tells the server about a practice conversation. */
export interface CoachContext {
  mode: 'tutor' | 'simulation';
  language: 'en' | 'es';
  job: {
    title: string;
    employer: string;
    sector: string;
    scenario: { name: string; character: string; setting: string };
  };
  skill: string;
  currentLevel: number;
  targetLevel: number;
  turns: ChatTurn[];
}

export interface Grade {
  level: number;
  confidence: number;
  quote: string;
}

export interface SimulationReview {
  scores: Record<SoftSkill, number>;
  summary: string;
  quote: string;
  tips: string[];
}

const MAX_TURNS = 40;
const MAX_TURN_CHARS = 2000;

const str = (value: unknown, max: number) =>
  typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim().slice(0, max)
    : '';

const int = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Validates the request body from the web app. */
export function parseCoachContext(body: unknown): CoachContext {
  const b = (body && typeof body === 'object' ? body : {}) as Record<
    string,
    unknown
  >;
  const mode = b.mode === 'simulation' ? 'simulation' : 'tutor';
  const job = (b.job && typeof b.job === 'object' ? b.job : {}) as Record<
    string,
    unknown
  >;
  const scenario = (
    job.scenario && typeof job.scenario === 'object' ? job.scenario : {}
  ) as Record<string, unknown>;
  const skill = str(b.skill, 80);
  if (mode === 'tutor' && !(SKILLS as readonly string[]).includes(skill)) {
    throw new BadRequestException('Unknown skill');
  }
  if (!Array.isArray(b.turns) || b.turns.length > MAX_TURNS) {
    throw new BadRequestException('Invalid conversation');
  }
  const turns: ChatTurn[] = b.turns.map((t: unknown) => {
    const turn = (t && typeof t === 'object' ? t : {}) as Record<
      string,
      unknown
    >;
    if (turn.role !== 'user' && turn.role !== 'assistant') {
      throw new BadRequestException('Invalid conversation');
    }
    return { role: turn.role, text: str(turn.text, MAX_TURN_CHARS) };
  });
  return {
    mode,
    language: b.language === 'es' ? 'es' : 'en',
    job: {
      title: str(job.title, 100),
      employer: str(job.employer, 100),
      sector: str(job.sector, 60),
      scenario: {
        name: str(scenario.name, 120),
        character: str(scenario.character, 200),
        setting: str(scenario.setting, 200),
      },
    },
    skill,
    currentLevel: int(b.currentLevel, 0, 6, 0),
    targetLevel: int(b.targetLevel, 1, 6, 3),
    turns,
  };
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** The first `words` words of a text, used when the model's quote isn't verbatim. */
const firstWords = (text: string, words: number) =>
  text.split(/\s+/).slice(0, words).join(' ');

/**
 * A grade the app can trust: a whole Bloom level from 1 to 6, confidence from 0 to 1,
 * and a quote taken from the learner's own answer.
 */
export function toGrade(raw: unknown, answer: string): Grade {
  const g = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  const quote = str(g.quote, 200).replace(/^["'“”]+|["'“”]+$/g, '');
  const confidence = Number(g.confidence);
  return {
    level: int(g.level, 1, 6, 1),
    confidence: Number.isFinite(confidence)
      ? Math.round(Math.min(1, Math.max(0, confidence)) * 100) / 100
      : 0.5,
    quote:
      quote && normalize(answer).includes(normalize(quote))
        ? quote
        : firstWords(answer, 15),
  };
}

export function toReview(
  raw: unknown,
  learnerText: string[],
): SimulationReview {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  const scores = (
    r.scores && typeof r.scores === 'object' ? r.scores : {}
  ) as Record<string, unknown>;
  const quote = str(r.quote, 300).replace(/^["'“”]+|["'“”]+$/g, '');
  const all = normalize(learnerText.join(' '));
  return {
    scores: Object.fromEntries(
      SOFT_SKILLS.map((k) => [k, int(scores[k], 1, 5, 3)]),
    ) as Record<SoftSkill, number>,
    summary: str(r.summary, 600),
    quote:
      quote && all.includes(normalize(quote))
        ? quote
        : firstWords(learnerText.at(-1) ?? '', 25),
    tips: (Array.isArray(r.tips) ? r.tips : [])
      .map((t) => str(t, 200))
      .filter(Boolean)
      .slice(0, 3),
  };
}
