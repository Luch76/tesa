import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
process.env.JWT_SECRET = 'test-jwt-secret';
const uploadDir = mkdtempSync(join(tmpdir(), 'tesa-uploads-'));
process.env.UPLOAD_DIR = uploadDir;

const pdf = Buffer.from('%PDF-1.4\n%test resume\n');

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let cookie: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    const token = await app.get(JwtService).signAsync({
      sub: '42',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
    });
    cookie = `access_token=${token}`;
  });

  it('/health (GET) is public', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/ (GET) sends browsers without a session to /login', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Accept', 'text/html')
      .expect(302)
      .expect('Location', '/login');
  });

  it('/ (GET) opens the Resume tab for a signed-in user', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Cookie', cookie)
      .expect(302)
      .expect('Location', '/resume');
  });

  it.each(['/resume', '/socratic', '/settings'])(
    '%s (GET) renders the tab for a signed-in user',
    (path) => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(200)
        .expect('Content-Type', /text\/html/)
        .expect(new RegExp(`href="${path}" aria-current="page"`));
    },
  );

  it('/settings (GET) shows the signed-in user', () => {
    return request(app.getHttpServer())
      .get('/settings')
      .set('Cookie', cookie)
      .expect(200)
      .expect(/Ada Lovelace/)
      .expect(/ada@example\.com/);
  });

  it.each(['/resume', '/socratic', '/settings'])(
    '%s (GET) sends browsers without a session to /login',
    (path) => {
      return request(app.getHttpServer())
        .get(path)
        .set('Accept', 'text/html')
        .expect(302)
        .expect('Location', '/login');
    },
  );

  it('/login (GET) shows the Google login link', () => {
    return request(app.getHttpServer())
      .get('/login')
      .expect(200)
      .expect(/Login with Google/);
  });

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

  describe('resume upload', () => {
    afterEach(() => {
      rmSync(uploadDir, { recursive: true, force: true });
    });

    it('stores a PDF and shows it on the Resume tab', async () => {
      await request(app.getHttpServer())
        .post('/resume')
        .set('Cookie', cookie)
        .attach('resume', pdf, 'Ada Résumé.pdf')
        .expect(303)
        .expect('Location', '/resume?uploaded=1');

      await request(app.getHttpServer())
        .get('/resume?uploaded=1')
        .set('Cookie', cookie)
        .expect(200)
        .expect(/Ada Résumé\.pdf/)
        .expect(/Resume uploaded\./);

      const file = await request(app.getHttpServer())
        .get('/resume/file')
        .set('Cookie', cookie)
        .expect(200)
        .expect('Content-Type', 'application/pdf')
        .expect('X-Content-Type-Options', 'nosniff');
      expect(file.headers['content-disposition']).toMatch(/^inline;/);
      expect(Buffer.from(file.body as Buffer).equals(pdf)).toBe(true);
    });

    it('rejects a file whose contents are not a PDF or Word document', () => {
      return request(app.getHttpServer())
        .post('/resume')
        .set('Cookie', cookie)
        .attach('resume', Buffer.from('<html>not a pdf</html>'), 'resume.pdf')
        .expect(303)
        .expect('Location', '/resume?error=type');
    });

    it('rejects files over 5 MB', () => {
      return request(app.getHttpServer())
        .post('/resume')
        .set('Cookie', cookie)
        .attach(
          'resume',
          Buffer.concat([pdf, Buffer.alloc(5 * 1024 * 1024)]),
          'big.pdf',
        )
        .expect(303)
        .expect('Location', '/resume?error=too-large');
    });

    it('asks for a file when none is chosen', () => {
      return request(app.getHttpServer())
        .post('/resume')
        .set('Cookie', cookie)
        .field('nothing', '')
        .expect(303)
        .expect('Location', '/resume?error=missing');
    });

    it('removes the resume', async () => {
      await request(app.getHttpServer())
        .post('/resume')
        .set('Cookie', cookie)
        .attach('resume', pdf, 'resume.pdf')
        .expect(303);
      await request(app.getHttpServer())
        .post('/resume/delete')
        .set('Cookie', cookie)
        .expect(303)
        .expect('Location', '/resume?removed=1');
      await request(app.getHttpServer())
        .get('/resume/file')
        .set('Cookie', cookie)
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('keeps each user’s resume separate', async () => {
      await request(app.getHttpServer())
        .post('/resume')
        .set('Cookie', cookie)
        .attach('resume', pdf, 'resume.pdf')
        .expect(303);
      const other = await app.get(JwtService).signAsync({
        sub: '99',
        email: 'grace@example.com',
        name: 'Grace Hopper',
      });
      await request(app.getHttpServer())
        .get('/resume/file')
        .set('Cookie', `access_token=${other}`)
        .set('Accept', 'application/json')
        .expect(404);
    });

    it('requires a login to upload', () => {
      return request(app.getHttpServer())
        .post('/resume')
        .attach('resume', pdf, 'resume.pdf')
        .expect(401);
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
