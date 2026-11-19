/**
 * api.js
 * REST API Client for Virtual CPU Backend
 */

const BASE_URL = '/api';
async function readResponse(response) {
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export const api = {
  // Simulation Controls
  start: () => fetch(`${BASE_URL}/simulation/start`, { method: 'POST' }).then(readResponse),
  pause: () => fetch(`${BASE_URL}/simulation/pause`, { method: 'POST' }).then(readResponse),
  resume: () => fetch(`${BASE_URL}/simulation/resume`, { method: 'POST' }).then(readResponse),
  reset: () => fetch(`${BASE_URL}/simulation/reset`, { method: 'POST' }).then(readResponse),
  step: () => fetch(`${BASE_URL}/simulation/step`, { method: 'POST' }).then(readResponse),
  setSpeed: (speedMs) => fetch(`${BASE_URL}/simulation/speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speedMs })
  }).then(readResponse),
  getState: () => fetch(`${BASE_URL}/simulation/state`).then(readResponse),

  // CPU
  getCpuState: () => fetch(`${BASE_URL}/cpu/state`).then(readResponse),
  getRegisters: () => fetch(`${BASE_URL}/cpu/registers`).then(readResponse),
  getHistory: (limit = 50) => fetch(`${BASE_URL}/cpu/history?limit=${limit}`).then(readResponse),
  getProgram: () => fetch(`${BASE_URL}/cpu/program`).then(readResponse),
  loadProgram: (source) => fetch(`${BASE_URL}/cpu/program`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source })
  }).then(readResponse),
  getMemory: (start = 0, length = 64) => fetch(`${BASE_URL}/cpu/memory?start=${start}&length=${length}`).then(readResponse),

  // Traffic
  getTrafficState: () => fetch(`${BASE_URL}/traffic/state`).then(readResponse),
  spawnVehicle: (direction, type = 'car', count = 1) => fetch(`${BASE_URL}/traffic/spawn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction, type, count })
  }).then(readResponse),
  setSpawnRate: (direction, rate) => fetch(`${BASE_URL}/traffic/spawn-rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction, rate })
  }).then(readResponse),
  triggerEmergency: (direction) => fetch(`${BASE_URL}/traffic/emergency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction })
  }).then(readResponse),

  // Analytics
  getAnalytics: () => fetch(`${BASE_URL}/analytics/summary`).then(readResponse)
};
