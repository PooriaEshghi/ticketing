import request from 'supertest';
import { app } from '../../app';

it('returns ok from /health', async () => {
  const response = await request(app).get('/health').expect(200);
  expect(response.body.status).toEqual('ok');
});
