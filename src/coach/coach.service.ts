import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiClient, ChatMessage } from '../ai/ai.client.js';
import { parseModelJson } from '../analysis/profile.js';
import { BLOOM } from '../analysis/skills.js';
import {
  CoachContext,
  Grade,
  SimulationReview,
  SOFT_SKILLS,
  toGrade,
  toReview,
} from './coach.types.js';

const languageName = (ctx: CoachContext) =>
  ctx.language === 'es' ? 'Spanish' : 'English';

const bloomScale = BLOOM.slice(1)
  .map((b, i) => `${i + 1} ${b}`)
  .join(', ');

function tutorPrompt(ctx: CoachContext): string {
  const { job, skill, currentLevel, targetLevel } = ctx;
  return `You are TESA, a Socratic career tutor for job seekers in Miami.
The learner is practicing "${skill}" for the role ${job.title} at ${job.employer} (${job.sector}).
Their current level is L${currentLevel} (${BLOOM[currentLevel]}); the role needs L${targetLevel} (${BLOOM[targetLevel]}).
Bloom levels: ${bloomScale}.

How to tutor:
- Never hand over the answer. Ask one focused question at a time that builds on what the learner just said.
- Aim each question one Bloom level above what their last answer showed, using realistic situations from this role.
- If an answer is vague, ask them to be specific about what they would check or do, and why.
- Keep replies under 80 words, warm and direct. Write the reply in ${languageName(ctx)}.

Also grade the learner's LAST answer for "${skill}":
- level: the Bloom level (1 to 6) the answer actually demonstrates. Be conservative; off-topic or very short answers are 1.
- confidence: 0 to 1, how sure you are of that level.
- quote: up to 15 words copied word for word from the learner's last answer that best shows the level.

Reply with one JSON object only: {"reply": string, "grade": {"level": number, "confidence": number, "quote": string}}`;
}

function simulationPrompt(ctx: CoachContext): string {
  const { job } = ctx;
  return `You are role-playing a workplace practice scenario for a job seeker in Miami training for ${job.title} at ${job.employer} (${job.sector}).
Scenario: "${job.scenario.name}". You are: ${job.scenario.character}. Setting: ${job.scenario.setting}.

Stay in character as that person; the learner is the employee helping you.
React realistically to how well they handle it: push back or escalate if they are dismissive or vague, and calm down when they acknowledge the problem and offer a concrete solution and follow-up.
Never coach or break character. Keep each reply under 60 words, in ${languageName(ctx)}.

Reply with one JSON object only: {"reply": string}`;
}

function reviewPrompt(ctx: CoachContext): string {
  const { job } = ctx;
  return `You evaluate a job seeker's performance in a workplace practice simulation for ${job.title} at ${job.employer}.
Scenario: "${job.scenario.name}" with ${job.scenario.character}.
The learner is the employee (role "user" in the transcript).

Score the learner from 1 (poor) to 5 (excellent) on: ${SOFT_SKILLS.join(', ')}.
Write in ${languageName(ctx)}:
- summary: two sentences on what they did well and what held them back, starting with a verb (e.g. "Acknowledged ...").
- quote: up to 25 words copied word for word from the learner's messages that best shows their strongest moment.
- tips: exactly 3 short, specific, actionable tips.

Reply with one JSON object only: {"scores": {${SOFT_SKILLS.map((k) => `"${k}": number`).join(', ')}}, "summary": string, "quote": string, "tips": [string, string, string]}`;
}

/** The transcript as chat messages, with the learner as "user". */
const transcript = (ctx: CoachContext): ChatMessage[] =>
  ctx.turns
    .filter((t) => t.text)
    .map((t) => ({ role: t.role, content: t.text }));

@Injectable()
export class CoachService {
  constructor(private readonly ai: AiClient) {}

  /** The tutor's or simulated customer's next reply, plus a grade in tutor mode. */
  async turn(ctx: CoachContext): Promise<{ reply: string; grade?: Grade }> {
    const answer = ctx.turns.at(-1);
    const system =
      ctx.mode === 'tutor' ? tutorPrompt(ctx) : simulationPrompt(ctx);
    const raw = await this.askJson([
      { role: 'system', content: system },
      ...transcript(ctx),
    ]);
    const reply =
      typeof raw.reply === 'string' ? raw.reply.trim().slice(0, 1200) : '';
    if (!reply) {
      throw new ServiceUnavailableException(
        'The AI returned an empty reply. Please try again.',
      );
    }
    return ctx.mode === 'tutor' && answer?.role === 'user'
      ? { reply, grade: toGrade(raw.grade, answer.text) }
      : { reply };
  }

  /** Soft-skill scores, summary and tips for a finished simulation. */
  async review(ctx: CoachContext): Promise<SimulationReview> {
    const raw = await this.askJson([
      { role: 'system', content: reviewPrompt(ctx) },
      {
        role: 'user',
        content: ctx.turns
          .map(
            (t) => `${t.role === 'user' ? 'Learner' : 'Customer'}: ${t.text}`,
          )
          .join('\n'),
      },
    ]);
    return toReview(
      raw,
      ctx.turns.filter((t) => t.role === 'user').map((t) => t.text),
    );
  }

  private async askJson(
    messages: ChatMessage[],
  ): Promise<Record<string, unknown>> {
    const reply = await this.ai.completeJson(messages);
    try {
      const raw = parseModelJson(reply);
      if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
    } catch {
      // fall through
    }
    throw new ServiceUnavailableException(
      'The AI returned an unreadable answer. Please try again.',
    );
  }
}
