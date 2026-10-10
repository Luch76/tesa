import { BadRequestException } from '@nestjs/common';
import { parseCoachContext, toGrade, toReview } from './coach.types.js';

const answer =
  'I would call the insurer to confirm the plan is active and check if the MRI needs prior authorization';

describe('toGrade', () => {
  it('keeps a valid grade with a verbatim quote', () => {
    expect(
      toGrade(
        {
          level: 4,
          confidence: 0.834,
          quote: '"check if the MRI needs prior authorization"',
        },
        answer,
      ),
    ).toEqual({
      level: 4,
      confidence: 0.83,
      quote: 'check if the MRI needs prior authorization',
    });
  });

  it('clamps levels and confidence, and replaces invented quotes', () => {
    expect(
      toGrade({ level: 9, confidence: 3, quote: 'I am an expert' }, answer),
    ).toEqual({
      level: 6,
      confidence: 1,
      quote:
        'I would call the insurer to confirm the plan is active and check if the',
    });
    expect(toGrade({ level: 0 }, 'ok')).toEqual({
      level: 1,
      confidence: 0.5,
      quote: 'ok',
    });
  });
});

describe('toReview', () => {
  it('bounds scores, keeps three tips and a verbatim quote', () => {
    const review = toReview(
      {
        scores: {
          communication: 5,
          empathy: 7,
          problem_solving: 'x',
          composure: 0,
        },
        summary: 'Acknowledged the problem.',
        quote: 'I will call you by 9 AM',
        tips: ['One', 'Two', 'Three', 'Four'],
      },
      [
        'I am sorry about this.',
        'I will call you by 9 AM tomorrow with an update.',
      ],
    );
    expect(review).toEqual({
      scores: {
        communication: 5,
        empathy: 5,
        problem_solving: 3,
        composure: 1,
        professionalism: 3,
      },
      summary: 'Acknowledged the problem.',
      quote: 'I will call you by 9 AM',
      tips: ['One', 'Two', 'Three'],
    });
  });
});

describe('parseCoachContext', () => {
  const base = {
    mode: 'tutor',
    language: 'es',
    skill: 'Insurance Verification',
    job: { title: 'Patient Access Representative', employer: 'Bayfront' },
    currentLevel: 2,
    targetLevel: 3,
    turns: [{ role: 'user', text: '  hola   mundo ' }],
  };

  it('normalizes a valid request', () => {
    const ctx = parseCoachContext(base);
    expect(ctx.language).toBe('es');
    expect(ctx.turns).toEqual([{ role: 'user', text: 'hola mundo' }]);
  });

  it('rejects unknown skills and bad turns', () => {
    expect(() => parseCoachContext({ ...base, skill: 'Juggling' })).toThrow(
      BadRequestException,
    );
    expect(() =>
      parseCoachContext({ ...base, turns: [{ role: 'system', text: 'x' }] }),
    ).toThrow(BadRequestException);
  });
});
