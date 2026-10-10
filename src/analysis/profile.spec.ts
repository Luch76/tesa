import { parseModelJson, toProfile } from './profile.js';

const resume = `Ada Lovelace
Data Analyst, Miami (2019 to present)
- Built weekly revenue dashboards in Excel with pivot tables
- Speaks English and Spanish`;

describe('toProfile', () => {
  it('keeps known skills whose evidence is quoted from the resume', () => {
    const profile = toProfile(
      {
        name: 'Ada Lovelace',
        headline: 'Data Analyst',
        years: 6.4,
        languages: ['English', 'Spanish'],
        skills: [
          {
            skill: 'Data Analysis (Excel)',
            level: 4,
            evidence:
              'Built weekly revenue dashboards in  Excel with pivot tables.',
          },
        ],
      },
      resume,
    );
    expect(profile).toEqual({
      name: 'Ada Lovelace',
      headline: 'Data Analyst',
      years: 6,
      languages: ['English', 'Spanish'],
      skills: {
        'Data Analysis (Excel)': {
          level: 4,
          evidence:
            'Built weekly revenue dashboards in Excel with pivot tables',
        },
      },
    });
  });

  it('drops unknown skills, invented quotes and invalid levels', () => {
    const { skills } = toProfile(
      {
        skills: [
          { skill: 'Juggling', level: 3, evidence: 'Data Analyst' },
          { skill: 'SQL', level: 5, evidence: 'Wrote complex SQL queries' },
          { skill: 'Python', level: 0, evidence: 'Data Analyst' },
          {
            skill: 'Revenue Management',
            level: 9,
            evidence: 'revenue dashboards',
          },
        ],
      },
      resume,
    );
    expect(skills).toEqual({
      'Revenue Management': { level: 6, evidence: 'revenue dashboards' },
    });
  });

  it('fills safe defaults for missing or malformed fields', () => {
    expect(toProfile({ years: 'lots', languages: 'English' }, resume)).toEqual({
      name: '',
      headline: '',
      years: 0,
      languages: [],
      skills: {},
    });
  });
});

describe('parseModelJson', () => {
  it('reads plain and fenced JSON', () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseModelJson('Here you go:\n```json\n{"a":2}\n```')).toEqual({
      a: 2,
    });
  });

  it('rejects replies without JSON', () => {
    expect(() => parseModelJson('Sorry, I cannot help')).toThrow();
  });
});
