/**
 * routes.js
 * Express REST API Routes for Virtual CPU & Traffic Simulation
 */

import express from 'express';

export function createRouter(simulationService) {
  const router = express.Router();

  // --- Simulation Lifecycle APIs ---
  router.post('/simulation/start', (req, res) => {
    try {
      simulationService.start();
      res.json({ success: true, message: 'Simulation started' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/simulation/pause', (req, res) => {
    try {
      simulationService.pause();
      res.json({ success: true, message: 'Simulation paused' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/simulation/resume', (req, res) => {
    try {
      simulationService.resume();
      res.json({ success: true, message: 'Simulation resumed' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/simulation/reset', (req, res) => {
    try {
      const state = simulationService.reset();
      res.json({ success: true, message: 'Simulation reset', state });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/simulation/step', (req, res) => {
    try {
      const stepData = simulationService.step();
      res.json({ success: true, ...stepData });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/simulation/speed', (req, res) => {
    try {
      const { speedMs } = req.body;
      if (!Number.isFinite(speedMs) || speedMs < 5 || speedMs > 2000) {
        return res.status(400).json({ error: 'speedMs must be a finite number between 5 and 2000' });
      }
      simulationService.setSpeed(speedMs);
      res.json({ success: true, speedMs });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/simulation/state', (req, res) => {
    try {
      res.json(simulationService.getFullState());
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- CPU Architecture & Execution APIs ---
  router.get('/cpu/state', (req, res) => {
    try {
      res.json(simulationService.cpu.getState());
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/cpu/registers', (req, res) => {
    try {
      res.json(simulationService.cpu.registers.serialize());
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/cpu/datapath', (req, res) => {
    try {
      res.json(simulationService.cpu.activeDatapath || {});
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/cpu/history', (req, res) => {
    try {
      const limit = Number(req.query.limit ?? 50);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({error: 'limit must be 1..100'});
      res.json(simulationService.cpu.executionHistory.slice(0, limit));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/cpu/program', (req, res) => {
    try {
      res.json({ source: simulationService.getProgramSource() });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/cpu/program', (req, res) => {
    try {
      const { source } = req.body;
      if (!source || typeof source !== 'string') {
        return res.status(400).json({ error: 'Program source string is required' });
      }
      const result = simulationService.loadCustomProgram(source);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/cpu/memory', (req, res) => {
    try {
      const start = Number(req.query.start ?? 0);
      const length = Number(req.query.length ?? 32);
      if (!Number.isInteger(start) || start < 0 || start > 65535 || !Number.isInteger(length) || length < 1 || length > 1024) return res.status(400).json({error: 'Invalid memory range (length 1..1024)'});
      const dump = simulationService.cpu.memory.dumpRange(start, length);
      const ioMap = simulationService.cpu.memory.dumpIO();
      res.json({ memory: dump, io: ioMap });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Traffic Intersection APIs ---
  router.get('/traffic/state', (req, res) => {
    try {
      res.json(simulationService.traffic.getState());
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/traffic/spawn', (req, res) => {
    try {
      const { direction, type, count } = req.body;
      if (!['North', 'South', 'East', 'West'].includes(direction)) {
        return res.status(400).json({ error: 'Valid direction (North, South, East, West) required' });
      }
      const result = simulationService.spawnVehicle(direction, type ?? 'car', count ?? 1);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/traffic/spawn-rate', (req, res) => {
    try {
      const { direction, rate } = req.body;
      if (!['North', 'South', 'East', 'West'].includes(direction)) {
        return res.status(400).json({ error: 'Valid direction required' });
      }
      if (!Number.isFinite(rate) || rate < 0 || rate > 1) return res.status(400).json({error: 'rate must be 0..1'});
      simulationService.traffic.setSpawnRate(direction, rate);
      simulationService.io?.emit('traffic_state', simulationService.traffic.getState());
      res.json({ success: true, direction, rate });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/traffic/emergency', (req, res) => {
    try {
      const { direction } = req.body;
      if (!['North', 'South', 'East', 'West'].includes(direction)) {
        return res.status(400).json({ error: 'Valid direction (North, South, East, West) required' });
      }
      const result = simulationService.triggerEmergency(direction);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Analytics API ---
  router.get('/analytics/summary', (req, res) => {
    try {
      const summary = simulationService.getAnalytics();
      res.json(summary);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
