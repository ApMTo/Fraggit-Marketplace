import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './create-e2e-app';
import { describeE2e } from './helpers/describe-e2e';
import { getRegistrationTokenForEmail } from './helpers/redis.helper';
import { createTestUserPayload } from './helpers/test-user.factory';

describeE2e('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register rejects weak password', async () => {
    const user = createTestUserPayload({ password: 'weak' });

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(user)
      .expect(400);

    expect(response.body.status).toBe('error');
  });

  it('POST /api/auth/login rejects invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'missing-user@fraggit.test',
        password: 'Str0ng!Pass',
      })
      .expect(401);

    expect(response.body.status).toBe('error');
  });

  it('registers, verifies, logs in, and returns profile', async () => {
    const user = createTestUserPayload();
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/api/auth/register')
      .send(user)
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('success');
        expect(body.result.message).toBe('verification_email_sent');
      });

    const token = await getRegistrationTokenForEmail(user.email);
    expect(token).toBeTruthy();

    const verifyResponse = await agent
      .get(`/api/auth/verify/${token}`)
      .expect(200);

    expect(verifyResponse.body.status).toBe('success');
    expect(verifyResponse.body.result.user.email).toBe(user.email);

    const setCookies = verifyResponse.headers['set-cookie'] as
      string[] | undefined;
    const csrfToken = setCookies
      ?.find((cookie) => cookie.startsWith('XSRF-TOKEN='))
      ?.split(';')[0]
      ?.slice('XSRF-TOKEN='.length);

    expect(csrfToken).toBeTruthy();

    const profileResponse = await agent.get('/api/auth/me').expect(200);

    expect(profileResponse.body.result.user.email).toBe(user.email);

    await agent
      .post('/api/auth/logout')
      .set('x-csrf-token', csrfToken as string)
      .expect(200);

    await agent.get('/api/auth/me').expect(401);
  });
});
