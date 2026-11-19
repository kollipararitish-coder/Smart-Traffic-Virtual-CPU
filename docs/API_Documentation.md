# Backend API Documentation & Real-Time Protocol

This document specifies the REST API endpoints and real-time Socket.IO WebSocket protocol powering the Virtual CPU and Traffic Simulation backend.

Backend Host: `http://localhost:5000`

---

## 1. REST API Endpoints

### System & Health
- `GET /health`
  - Returns server status and project metadata.
  - Response:
    ```json
    {
      "status": "ONLINE",
      "project": "Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU",
      "timestamp": "2026-11-15T18:00:00.000Z"
    }
    ```

### Simulation Lifecycle APIs
- `POST /api/simulation/start`
  - Starts continuous simulation and CPU execution loop.
- `POST /api/simulation/pause`
  - Pauses execution without modifying hardware state.
- `POST /api/simulation/resume`
  - Resumes execution loop.
- `POST /api/simulation/step`
  - Advances one complete instruction, or one idle WAIT tick, plus corresponding traffic time. Pause before stepping.
  - Response: `{ success: true, result: {...}, cpu: {...}, traffic: {...} }`
- `POST /api/simulation/reset`
  - Resets all CPU registers, memory, traffic queues, and simulation state to initial documented states.
- `POST /api/simulation/speed`
  - Sets instruction/idle-tick delay, 10..2000 ms.
  - Body: `{ "speedMs": 150 }`
- `GET /api/simulation/state`
  - Retrieves combined CPU, traffic, and program state.

### CPU Architecture & Execution APIs
- `GET /api/cpu/state`
  - Returns current registers, flags, instruction, stage, datapath state, and interrupt status.
- `GET /api/cpu/registers`
  - Returns serialized register file `{ PC, IR, ACC, R0, R1, R2, R3, SP, FLAGS, CLOCK, STAGE }`.
- `GET /api/cpu/datapath`
  - Returns active components, buses, and micro-signals for current stage.
- `GET /api/cpu/history?limit=50`
  - Returns recent execution trace history.
- `GET /api/cpu/program`
  - Returns loaded assembly source text.
- `POST /api/cpu/program`
  - Assembles and loads custom assembly source code into CPU memory.
  - Body: `{ "source": "ORG 0x0020\nLOAD R0, #10\nHALT" }`
- `GET /api/cpu/memory?start=32&length=32`
  - Dumps memory contents in requested range.

### Traffic Intersection APIs
- `GET /api/traffic/state`
  - Returns signal states (North, South, East, West), vehicle queues, vehicle counts, and statistics.
- `POST /api/traffic/spawn`
  - Spawns vehicles in a designated approach.
  - Body: `{ "direction": "North", "type": "car", "count": 1 }`
- `POST /api/traffic/spawn-rate`
  - Updates vehicle arrival generation probability per tick.
  - Body: `{ "direction": "North", "rate": 0.4 }`
- `POST /api/traffic/emergency`
  - Injects emergency vehicle and asserts hardware IRQ on Virtual CPU.
  - Body: `{ "direction": "East" }`

### Analytics API
- `GET /api/analytics/summary`
  - Queries SQLite database for session metrics, CPU instruction frequencies, traffic history, and emergency events.

---

## 2. Real-Time Socket.IO Protocol

### Client to Server Events
- `request_state`: Requests immediate state snapshot broadcast.
- `step`: Trigger single instruction cycle.
- `start`: Start simulation loop.
- `pause`: Pause simulation loop.
- `reset`: Reset simulation.
- `emergency`: Trigger emergency interrupt `{ direction: "North" }`.
- `set_speed`: Update speed `{ speedMs: 100 }`.

### Server to Client Events
- `initial_state`: Emitted upon connection with complete snapshot.
- `cpu_state`: Emitted on CPU register/stage changes.
- `traffic_state`: Emitted on traffic movement/departure ticks.
- `step_executed`: Emitted on single step execution with delta.
- `simulation_reset`: Emitted when simulation resets.
- `emergency_triggered`: Emitted when an emergency interrupt is generated.


## Validation and lifecycle

Malformed requests return HTTP 400 with `{ "error": "message" }`. Memory reads require an integer start 0..65535 and length 1..1024. History limit is 1..100. Vehicle counts are integers 1..100; spawn rates are finite 0..1; directions are North/South/East/West. Invalid assembly does not replace the last valid program. Loading a valid program ends the old session and resets traffic. HALT requires reset or a new program before Run/Step. Concurrent emergencies are rejected.

Socket commands use the same service validation; errors emit `simulation_error` with a message instead of crashing the server. REST and Socket.IO control one shared simulation. `cpu_state.lastError` describes a halted runtime fault. `traffic_state.simulationTime` is simulated elapsed seconds. Emergency database `clear_time` remains null until acknowledgement.
