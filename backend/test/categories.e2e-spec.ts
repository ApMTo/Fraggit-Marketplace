import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './create-e2e-app';
import { describeE2e } from './helpers/describe-e2e';

describeE2e('Categories (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/categories returns success envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/categories')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'success',
        result: expect.any(Array),
      }),
    );
  });
});
