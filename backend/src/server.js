/**
 * server.js
 * Express & Socket.IO HTTP Server Entry Point
 * Host of the Virtual CPU & Traffic Simulation System
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { SimulationService } from './services/SimulationService.js';
import { createRouter } from './routes/routes.js';

const app = express();
const server = http.createServer(app);

const localOrigins = new Set([`http://localhost:${process.env.PORT || 5000}`, `http://127.0.0.1:${process.env.PORT || 5000}`, 'http://localhost:5174', 'http://127.0.0.1:5174']);
const corsOptions = {origin: (origin, callback) => callback(null, !origin || localOrigins.has(origin))};
const io = new Server(server, {
  cors: corsOptions,
  allowRequest: (req, callback) => callback(null, !req.headers.origin || localOrigins.has(req.headers.origin))
});
app.use((req, res, next) => {
  if (req.headers.origin && !localOrigins.has(req.headers.origin)) return res.status(403).json({error: 'Origin not allowed'});
  next();
});
app.use(cors(corsOptions));
app.use(express.json());

// Initialize Master Simulation Orchestrator
const simulationService = new SimulationService(io);

// Mount API routes
app.use('/api', createRouter(simulationService));

// Root health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO event handling
io.on('connection', (socket) => {
  // Send current state upon initial connection
  socket.emit('initial_state', simulationService.getFullState());

  socket.on('request_state', () => {
    socket.emit('state_update', simulationService.getFullState());
  });

  const actions = {
    step: () => simulationService.step(),
    start: () => simulationService.start(),
    pause: () => simulationService.pause(),
    reset: () => simulationService.reset(),
    emergency: data => simulationService.triggerEmergency(data?.direction),
    set_speed: data => simulationService.setSpeed(data?.speedMs)
  };
  for (const [name, action] of Object.entries(actions)) {
    socket.on(name, data => {
      try { action(data); }
      catch (error) { socket.emit('simulation_error', {message: error.message}); }
    });
  }

});

// Built dashboard is served by the same backend (npm run build:frontend first).
const frontendDist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
app.use(express.static(frontendDist));

const PORT = process.env.PORT || 5000;

// Only listen if not imported by a test harness
if (process.env.NODE_ENV !== 'test') {
  const shutdown = () => { simulationService.close(); io.close(); server.close(); };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`=======================================================`);
    console.log(` SMART TRAFFIC SIGNAL CONTROLLER - COA VIRTUAL CPU`);
    console.log(` Backend server running at http://localhost:${PORT}`);
    console.log(` WebSocket server initialized with Socket.IO`);
    console.log(`=======================================================`);
  });
}

export { app, server, simulationService };
