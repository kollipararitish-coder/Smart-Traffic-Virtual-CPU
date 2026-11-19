import {describe,it,expect,afterAll} from 'vitest';
import express from 'express';
import request from 'supertest';
import {createRouter} from '../src/routes/routes.js';
import {SimulationService} from '../src/services/SimulationService.js';
import {Database} from '../src/database/database.js';
const service=new SimulationService(null,new Database(':memory:'));
const app=express(); app.use(express.json()); app.use('/api',createRouter(service));
afterAll(()=>service.close());
describe('API invalid inputs',()=>{
  it.each([
    ['/simulation/speed',{speedMs:3000}],
    ['/simulation/speed',{speedMs:'fast'}],
    ['/traffic/spawn',{direction:'North',count:0}],
    ['/traffic/spawn',{direction:'North',count:1.2}],
    ['/traffic/spawn',{direction:'North',count:100000}],
    ['/traffic/spawn',{direction:'North',type:42}],
    ['/traffic/spawn-rate',{direction:'North',rate:'bad'}],
    ['/traffic/emergency',{direction:'Invalid'}],
    ['/cpu/program',{source:'LOAD R9, #1'}]
  ])('rejects %s %j',async(path,body)=>{
    const result=await request(app).post('/api'+path).send(body);
    expect(result.status).toBe(400);expect(result.body.error).toBeTruthy();
  });
  it.each(['/cpu/memory?start=nope','/cpu/memory?length=65536','/cpu/history?limit=-1'])('bounds %s',async path=>{
    expect((await request(app).get('/api'+path)).status).toBe(400);
  });
});
