# Testing report — 16 November 2026

Tested locally on Linux with Node.js 24.22.1. These are observed results from this correction pass, not assumed outcomes.

## Automated tests

Command from project root: `npm test`

| Test file | Passing cases |
|---|---:|
| registers.test.js | 4 |
| alu.test.js | 7 |
| memory.test.js | 4 |
| instruction_and_cpu.test.js | 4 |
| interrupt.test.js | 1 |
| traffic_integration.test.js | 4 |
| api_and_db.test.js | 7 |
| regressions.test.js | 34 |
| api_validation.test.js | 12 |
| **Total** | **77** |

**9 test files passed; 77 tests passed; 0 failed.** Tests use in-memory SQLite databases and do not modify saved classroom sessions.

New regression coverage includes malformed assembly, first-ORG entry, HALT semantics, invalid IRET, four-direction emergency WAIT preemption/context restoration, repeated emergencies, missing ISR, continuous CPU logging, Step/Run timing equivalence (floating-point tolerance), timer duplication, reset totals, atomic program replacement, ACK completion, conflicting signal faults, red-light stopping, bus bumper clearance, lane spacing and live I/O sensors. API cases cover invalid speed, count, type, spawn rate, direction, memory range and history limit.

## Frontend build

Command: `npm run build:frontend`

**Passed** using Vite 6.4.6. Compiled HTML/CSS/JS are included in `frontend/dist`. Vite reports a non-blocking JavaScript chunk-size warning (approximately 689 kB uncompressed / 193 kB gzip); code splitting remains a possible performance improvement.

## HTTP and Socket.IO smoke checks

Started the Express server on a temporary loopback port within the test process:

- `/health` returned ONLINE.
- `/` returned the compiled dashboard HTML and the referenced JS asset returned HTTP 200.
- A foreign Origin request was rejected with HTTP 403.
- Socket.IO connected and received initial CPU state PAUSED with all four lane counts.
- Socket `step` returned instruction count 1 and CLOCK 5.
- Invalid socket emergency direction returned `simulation_error` rather than crashing.

## Limits of verification

The available browser could not connect to the workspace-local server (connection refused), so browser rendering, responsive appearance, canvas appearance and click-through behavior are **not visually verified**. Frontend compilation and API/socket behavior are verified. Windows batch scripts were corrected and inspected but not executed on Windows. Tests do not establish real-world traffic safety, fairness guarantees, load capacity or exhaustive correctness. See README for the execution model and known simulation limits.
