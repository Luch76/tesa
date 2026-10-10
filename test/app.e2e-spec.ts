import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/app.setup.js';

process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
process.env.JWT_SECRET = 'test-jwt-secret';
const uploadDir = mkdtempSync(join(tmpdir(), 'tesa-uploads-'));
process.env.UPLOAD_DIR = uploadDir;

// A stand-in for the built React app (web/dist/client).
const webDir = mkdtempSync(join(tmpdir(), 'tesa-web-'));
mkdirSync(join(webDir, 'assets'));
writeFileSync(
  join(webDir, '_shell.html'),
  '<!doctype html><html><body><div id="app">TESA shell</div></body></html>',
);
writeFileSync(join(webDir, 'assets', 'app-abc123.js'), 'console.log("app")');
process.env.WEB_DIR = webDir;

const pdf = Buffer.from('%PDF-1.4\n%test resume\n');

/** A stand-in for the AI (OpenAI-compatible chat completions), counting calls. */
const ai = {
  calls: 0,
  lastBody: undefined as
    { model?: string; messages?: { content: string }[] } | undefined,
  reply: {} as unknown,
};
let aiServer: Server;
beforeAll(async () => {
  aiServer = createServer((req, res) => {
    let body = '';
    req.on('data', (c: Buffer) => (body += c.toString()));
    req.on('end', () => {
      ai.calls++;
      ai.lastBody = JSON.parse(body);
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(ai.reply) } }],
        }),
      );
    });
  });
  await new Promise<void>((done) => aiServer.listen(0, '127.0.0.1', done));
  process.env.AI_BASE_URL = `http://127.0.0.1:${(aiServer.address() as AddressInfo).port}/v1`;
  process.env.AI_MODEL = 'google/test-model';
});
afterAll(() => aiServer.close());

describe('App (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    setupApp(app);
    await app.init();

    const token = await app.get(JwtService).signAsync({
      sub: '42',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
    });
    cookie = `access_token=${token}`;
  });

  afterAll(() => {
    rmSync(webDir, { recursive: true, force: true });
  });

  it('/health (GET) is public', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/login (GET) shows the Google login link', () => {
    return request(app.getHttpServer())
      .get('/login')
      .expect(200)
      .expect(/Login with Google/);
  });

  describe('web app', () => {
    it.each(['/', '/jobs', '/coach', '/portfolio'])(
      '%s (GET) serves the app shell to a signed-in user',
      (path) => {
        return request(app.getHttpServer())
          .get(path)
          .set('Cookie', cookie)
          .expect(200)
          .expect('Content-Type', /text\/html/)
          .expect(/TESA shell/);
      },
    );

    it.each(['/', '/jobs'])(
      '%s (GET) sends browsers without a session to /login',
      (path) => {
        return request(app.getHttpServer())
          .get(path)
          .set('Accept', 'text/html')
          .expect(302)
          .expect('Location', '/login');
      },
    );

    it('serves built assets publicly with long-lived caching', () => {
      return request(app.getHttpServer())
        .get('/assets/app-abc123.js')
        .expect(200)
        .expect('Cache-Control', /immutable/)
        .expect(/console\.log/);
    });

    it('does not serve the shell for unknown API paths', () => {
      return request(app.getHttpServer())
        .get('/api/nope')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .expect(404);
    });
  });

  describe('auth', () => {
    it('/auth/google (GET) redirects to Google', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/google')
        .expect(302);
      expect(res.headers.location).toMatch(
        /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?.*client_id=test-client-id/,
      );
    });

    it('/auth/me (GET) returns 401 JSON without a session', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Accept', 'application/json')
        .expect(401);
    });

    it('/auth/me (GET) returns the signed-in user', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookie)
        .expect(200)
        .expect({ id: '42', email: 'ada@example.com', name: 'Ada Lovelace' });
    });

    it('/auth/me (GET) rejects a tampered token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Accept', 'application/json')
        .set('Cookie', `${cookie}x`)
        .expect(401);
    });

    it('/auth/logout (POST) clears the cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookie)
        .expect(303)
        .expect('Location', '/login');
      expect(String(res.headers['set-cookie'])).toMatch(/access_token=;/);
    });
  });

  describe('resume API', () => {
    afterEach(() => {
      rmSync(uploadDir, { recursive: true, force: true });
    });

    const upload = (body: Buffer, name: string) =>
      request(app.getHttpServer())
        .post('/api/resume')
        .set('Cookie', cookie)
        .attach('resume', body, name);

    it('starts empty', () => {
      return request(app.getHttpServer())
        .get('/api/resume')
        .set('Cookie', cookie)
        .expect(200)
        .expect({ resume: null, profile: null });
    });

    it('stores a PDF and returns it', async () => {
      const res = await upload(pdf, 'Ada Résumé.pdf').expect(201);
      expect(res.body).toMatchObject({
        resume: {
          originalName: 'Ada Résumé.pdf',
          mimeType: 'application/pdf',
          size: pdf.length,
        },
      });

      await request(app.getHttpServer())
        .get('/api/resume')
        .set('Cookie', cookie)
        .expect(200)
        .expect((r) =>
          expect(r.body.resume.originalName).toBe('Ada Résumé.pdf'),
        );

      const file = await request(app.getHttpServer())
        .get('/api/resume/file')
        .set('Cookie', cookie)
        .expect(200)
        .expect('Content-Type', 'application/pdf')
        .expect('X-Content-Type-Options', 'nosniff');
      expect(file.headers['content-disposition']).toMatch(/^inline;/);
      expect(Buffer.from(file.body as Buffer).equals(pdf)).toBe(true);
    });

    it('accepts a plain-text resume', async () => {
      const res = await upload(
        Buffer.from('Ada Lovelace\nAnalyst, Café Miami'),
        'resume.txt',
      ).expect(201);
      expect(res.body.resume.mimeType).toBe('text/plain; charset=utf-8');
    });

    it('rejects a file whose contents do not match its type', async () => {
      const res = await upload(
        Buffer.from('<html>not a pdf</html>'),
        'resume.pdf',
      ).expect(415);
      expect(res.body.message).toMatch(/PDF, Word or text/);
    });

    it('rejects binary data disguised as text', () => {
      return upload(Buffer.from([0x00, 0x01, 0xff]), 'resume.txt').expect(415);
    });

    it('rejects files over 5 MB with a clear message', async () => {
      const res = await upload(
        Buffer.concat([pdf, Buffer.alloc(5 * 1024 * 1024)]),
        'big.pdf',
      ).expect(413);
      expect(res.body.message).toBe('That file is larger than 5 MB.');
    });

    it('asks for a file when none is chosen', () => {
      return request(app.getHttpServer())
        .post('/api/resume')
        .set('Cookie', cookie)
        .field('nothing', '')
        .expect(400);
    });

    it('removes the resume', async () => {
      await upload(pdf, 'resume.pdf').expect(201);
      await request(app.getHttpServer())
        .delete('/api/resume')
        .set('Cookie', cookie)
        .expect(204);
      await request(app.getHttpServer())
        .get('/api/resume/file')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('keeps each user’s resume separate', async () => {
      await upload(pdf, 'resume.pdf').expect(201);
      const other = await app.get(JwtService).signAsync({
        sub: '99',
        email: 'grace@example.com',
        name: 'Grace Hopper',
      });
      await request(app.getHttpServer())
        .get('/api/resume')
        .set('Cookie', `access_token=${other}`)
        .expect({ resume: null, profile: null });
    });

    describe('analysis', () => {
      beforeEach(() => {
        ai.calls = 0;
        ai.reply = {
          name: 'Ada Lovelace',
          headline: 'Data Analyst',
          years: 6,
          languages: ['English', 'Spanish'],
          skills: [
            {
              skill: 'Data Analysis (Excel)',
              level: 4,
              evidence:
                'Built weekly revenue dashboards in Excel with pivot tables',
            },
            { skill: 'SQL', level: 5, evidence: 'Wrote complex SQL queries' },
            { skill: 'Juggling', level: 3, evidence: 'Data Analyst' },
          ],
        };
      });

      const analyze = (body?: object) =>
        request(app.getHttpServer())
          .post('/api/resume/analyze')
          .set('Cookie', cookie)
          .send(body ?? {});

      it.each([['resume.pdf'], ['resume.docx']])(
        'builds a profile from an uploaded %s',
        async (name) => {
          await upload(
            readFileSync(join(import.meta.dirname, 'fixtures', name)),
            name,
          ).expect(201);
          const res = await analyze().expect(200);

          expect(res.body.profile).toEqual({
            name: 'Ada Lovelace',
            headline: 'Data Analyst',
            years: 6,
            languages: ['English', 'Spanish'],
            // SQL's quote isn't in the resume and Juggling isn't a known skill.
            skills: {
              'Data Analysis (Excel)': {
                level: 4,
                evidence:
                  'Built weekly revenue dashboards in Excel with pivot tables',
              },
            },
          });
          expect(ai.lastBody?.model).toBe('google/test-model');
          expect(ai.lastBody?.messages?.at(-1)?.content).toContain(
            'Built weekly revenue dashboards',
          );
        },
      );

      it('reuses the saved analysis until a new file is uploaded', async () => {
        const text = Buffer.from(
          'Ada Lovelace\nBuilt weekly revenue dashboards in Excel with pivot tables',
        );
        await upload(text, 'resume.txt').expect(201);
        await analyze().expect(200);
        await analyze().expect(200);
        expect(ai.calls).toBe(1);

        await request(app.getHttpServer())
          .get('/api/resume')
          .set('Cookie', cookie)
          .expect((r) => expect(r.body.profile.name).toBe('Ada Lovelace'));

        await upload(text, 'resume.txt').expect(201);
        await request(app.getHttpServer())
          .get('/api/resume')
          .set('Cookie', cookie)
          .expect((r) => expect(r.body.profile).toBeNull());
        await analyze().expect(200);
        expect(ai.calls).toBe(2);
      });

      it('analyzes pasted text without storing it', async () => {
        const res = await analyze({
          text: 'Ada Lovelace\nBuilt weekly revenue dashboards in Excel with pivot tables',
        }).expect(200);
        expect(Object.keys(res.body.profile.skills)).toEqual([
          'Data Analysis (Excel)',
        ]);
        await request(app.getHttpServer())
          .get('/api/resume')
          .set('Cookie', cookie)
          .expect({ resume: null, profile: null });
      });

      it('asks for a resume when there is nothing to analyze', async () => {
        const res = await analyze().expect(400);
        expect(res.body.message).toBe('Add your resume first.');
      });

      it('explains when the AI is not configured', async () => {
        await app.close();
        const saved = process.env.AI_BASE_URL;
        process.env.AI_BASE_URL = '';
        try {
          const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
          }).compile();
          app = moduleFixture.createNestApplication<NestExpressApplication>();
          setupApp(app);
          await app.init();
          const res = await analyze({ text: 'Ada Lovelace, analyst' }).expect(
            503,
          );
          expect(res.body.message).toMatch(/not configured/);
        } finally {
          process.env.AI_BASE_URL = saved;
        }
      });
    });

    it('requires a login', () => {
      return request(app.getHttpServer())
        .post('/api/resume')
        .set('Accept', 'application/json')
        .attach('resume', pdf, 'resume.pdf')
        .expect(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
