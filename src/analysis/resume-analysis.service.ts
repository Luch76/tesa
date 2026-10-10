import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiClient } from '../ai/ai.client.js';
import { parseModelJson, Profile, toProfile } from './profile.js';
import { BLOOM, SKILLS } from './skills.js';

const MAX_RESUME_CHARS = 20_000;

const SYSTEM_PROMPT = `You read resumes for TESA Miami, a career-readiness app, and turn them into a skills profile.

Reply with a single JSON object and nothing else:
{
  "name": string,          // the person's name as written on the resume
  "headline": string,      // current or most recent role and field, e.g. "Front Desk Supervisor, hospitality" (max 60 characters)
  "years": number,         // whole years of professional work experience
  "languages": string[],   // spoken languages the resume states, in English (e.g. "English", "Spanish"); [] if none stated
  "skills": [ { "skill": string, "level": number, "evidence": string } ]
}

Skills: use only these exact names, and include a skill only when the resume shows it:
${SKILLS.map((s) => `- ${s}`).join('\n')}

Level is a Bloom level from 1 to 6 for what the resume demonstrates:
${BLOOM.slice(1)
  .map((b, i) => `${i + 1} = ${b}`)
  .join(', ')}.
Mentioned or exposed = 1; understands or basic use = 2; uses it regularly in the job = 3; analyzes, troubleshoots or reports on it = 4; owns, evaluates, improves or leads others in it = 5; designs or creates new systems or programs with it = 6. Be conservative.

Evidence: copy one short phrase (under 120 characters) word for word from the resume that supports the level. Do not paraphrase, translate or combine lines.`;

@Injectable()
export class ResumeAnalysisService {
  constructor(private readonly ai: AiClient) {}

  async analyze(resumeText: string): Promise<Profile> {
    const text = resumeText.slice(0, MAX_RESUME_CHARS);
    const reply = await this.ai.completeJson([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Resume:\n"""\n${text}\n"""` },
    ]);
    let raw: unknown;
    try {
      raw = parseModelJson(reply);
    } catch {
      throw new ServiceUnavailableException(
        'The AI returned an unreadable answer. Please try again.',
      );
    }
    return toProfile(raw, text);
  }
}
