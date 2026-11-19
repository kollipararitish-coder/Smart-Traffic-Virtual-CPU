/**
 * api_and_db.test.js
 * Integration tests for Backend REST APIs and SQLite Database Persistence
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, simulationService } from '../src/server.js';

afterAll(() => simulationService.close());

describe('Backend REST APIs & Database Persistence', () => {
  beforeAll(() => {
    simulationService.reset();
  });

  it('GET /health returns 200 and project metadata', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ONLINE');
    expect(res.body.project).toContain('Instruction-Level Virtual CPU');
  });

  it('GET /api/cpu/state returns valid architectural state', async () => {
    const res = await request(app).get('/api/cpu/state');
    expect(res.status).toBe(200);
    expect(res.body.registers).toBeDefined();
    expect(res.body.registers.PC).toBeDefined();
    expect(res.body.registers.FLAGS).toBeDefined();
  });

  it('POST /api/simulation/step advances CPU by exactly one instruction and logs to database', async () => {
    const res = await request(app).post('/api/simulation/step');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result).toBeDefined();
    expect(res.body.cpu).toBeDefined();
    expect(res.body.traffic).toBeDefined();
  });

  it('POST /api/simulation/speed updates CPU clock speed', async () => {
    const res = await request(app).post('/api/simulation/speed').send({ speedMs: 250 });
    expect(res.status).toBe(200);
    expect(res.body.speedMs).toBe(250);
  });

  it('POST /api/traffic/spawn spawns a vehicle in designated direction', async () => {
    const res = await request(app)
      .post('/api/traffic/spawn')
      .send({ direction: 'North', type: 'truck', count: 2 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/traffic/emergency triggers emergency preemption', async () => {
    const res = await request(app)
      .post('/api/traffic/emergency')
      .send({ direction: 'South' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.direction).toBe('South');
  });

  it('GET /api/analytics/summary returns stored SQLite analytics', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.session).toBeDefined();
    expect(res.body.cpuStats).toBeDefined();
    expect(res.body.instructionFrequency).toBeDefined();
  });
});
