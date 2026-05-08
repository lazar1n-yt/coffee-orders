import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /api/health', () => {
  it('повертає 200 і поле status=ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('GET /api/unknown', () => {
  it('повертає 404 з кодом NOT_FOUND', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/orders валідація', () => {
  it('повертає 400 на порожнє тіло', async () => {
    const res = await request(app).post('/api/orders').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
