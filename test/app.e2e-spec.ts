import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
process.env.JWT_SECRET = 'test-jwt-secret';

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

  it('/ (GET) greets a signed-in user', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Cookie', cookie)
      .expect(200)
      .expect(/Hello, Ada Lovelace!/);
  });

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

  afterEach(async () => {
    await app.close();
  });
});
