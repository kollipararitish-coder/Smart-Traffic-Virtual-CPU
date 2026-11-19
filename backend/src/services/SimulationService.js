/** Coordinates CPU, traffic, persistence and live UI using a single simulation clock. */
import { CPU } from '../cpu/CPU.js';
import { TrafficController } from '../traffic/TrafficController.js';
import { DEFAULT_TRAFFIC_PROGRAM } from '../traffic/TrafficProgram.js';
import { Assembler } from '../cpu/Assembler.js';
import { Database } from '../database/database.js';

export class SimulationService {
  constructor(io = null, database = null) {
    this.io = io;
    this.cpu = new CPU();
    this.traffic = new TrafficController(this.cpu);
    this.db = database || new Database();
    this.sessionId = this.db.createSession();
    this.programSource = DEFAULT_TRAFFIC_PROGRAM;
    this.simulationLoopTimer = null;
    this.elapsedMs = 0;
    this.persistSeconds = 0;
    this.cpu.loadProgram(this.programSource);
    this.cpu.onStateChange(state => this.io?.emit('cpu_state', state));
    this.traffic.onEmergencyCleared = () => this.db.completeEmergency(this.sessionId);
  }

  setIO(io) { this.io = io; }

  start() {
    if (this.simulationLoopTimer) return;
    if (this.cpu.state === 'HALTED') throw new Error('CPU halted: reset or load a program');
    this.cpu.state = 'RUNNING';
    this.cpu.notifyStateChange();
    // Each heartbeat advances 20 ms of simulation time. No independent CPU timer.
    this.simulationLoopTimer = setInterval(() => {
      try { this.advanceTime(0.02); }
      catch (error) { this.fail(error); }
    }, 20);
    this.io?.emit('simulation_status', {status: 'RUNNING'});
  }

  advanceTime(seconds) {
    let remaining = seconds;
    while (remaining > 1e-9 && this.cpu.state !== 'HALTED') {
      const dt = Math.min(0.02, remaining, (this.cpu.clockSpeedMs - this.elapsedMs) / 1000);
      this.traffic.tick(dt);
      this.elapsedMs += dt * 1000;
      this.persistSeconds += dt;
      remaining -= dt;
      if (this.elapsedMs >= this.cpu.clockSpeedMs - 1e-7) {
        this.elapsedMs = 0;
        this.executeCPU();
      }
      if (this.persistSeconds >= 1.5) {
        this.persistSeconds = 0;
        this.db.recordTrafficStats(this.sessionId, this.traffic.getState());
      }
    }
    this.io?.emit('traffic_state', this.traffic.getState());
  }

  executeCPU() {
    const result = this.cpu.step();
    if (result.traceEntry) this.db.logCpuExecution(this.sessionId, result.traceEntry);
    if (this.cpu.state === 'HALTED') {
      this.stopTimer();
      this.traffic.allRed();
      this.cpu.notifyStateChange();
    }
    this.lastResult = result;
    return result;
  }

  stopTimer() {
    if (this.simulationLoopTimer) clearInterval(this.simulationLoopTimer);
    this.simulationLoopTimer = null;
  }

  fail(error) {
    this.stopTimer();
    this.cpu.state = 'HALTED';
    this.cpu.lastError = error.message;
    this.traffic.allRed();
    this.cpu.notifyStateChange();
    this.io?.emit('simulation_error', {message: error.message});
    this.io?.emit('traffic_state', this.traffic.getState());
  }

  pause() {
    this.stopTimer();
    this.cpu.pause();
    this.io?.emit('simulation_status', {status: this.cpu.state});
  }
  resume() { this.start(); }

  step() {
    if (this.simulationLoopTimer) throw new Error('Pause before single stepping');
    if (this.cpu.state === 'HALTED') throw new Error('CPU halted: reset or load a program');
    try {
      this.advanceTime((this.cpu.clockSpeedMs - this.elapsedMs) / 1000);
      const data = {result: this.lastResult, cpu: this.cpu.getState(), traffic: this.traffic.getState()};
      this.io?.emit('step_executed', data);
      return data;
    } catch (error) { this.fail(error); throw error; }
  }

  endSession() {
    this.db.endSession(this.sessionId, {
      totalCycles: this.cpu.registers.CLOCK,
      totalInstructions: this.cpu.instructionCount,
      totalVehiclesPassed: this.traffic.stats.totalPassed
    });
  }

  reset() {
    this.pause();
    this.endSession();
    this.cpu.reset();
    this.traffic.reset();
    this.traffic.seedInitialQueues();
    this.cpu.loadProgram(this.programSource);
    this.sessionId = this.db.createSession();
    this.elapsedMs = 0;
    this.persistSeconds = 0;
    const state = this.getFullState();
    this.io?.emit('simulation_reset', state);
    return state;
  }

  setSpeed(speedMs) {
    this.cpu.setClockSpeed(speedMs);
    this.elapsedMs = 0;
    // setClockSpeed can start CPU's standalone timer; service owns the clock.
    if (this.cpu.timer) { clearTimeout(this.cpu.timer); this.cpu.timer = null; }
    this.io?.emit('clock_speed_changed', {speedMs});
  }

  triggerEmergency(direction) {
    const result = this.traffic.triggerEmergency(direction);
    this.db.recordEmergencyEvent(this.sessionId, {direction: result.direction, triggerTime: new Date().toISOString()});
    this.io?.emit('emergency_triggered', {direction, traffic: this.traffic.getState(), cpu: this.cpu.getState()});
    return result;
  }

  spawnVehicle(direction, type = 'car', count = 1) {
    this.traffic.addVehicle(direction, type, count);
    this.io?.emit('traffic_state', this.traffic.getState());
    return {success: true, count: this.traffic.queues[direction].length};
  }

  loadCustomProgram(source) {
    Assembler.assemble(source); // Failed edits leave the running program/session untouched.
    this.pause();
    this.endSession();
    this.traffic.reset();
    this.traffic.seedInitialQueues();
    const result = this.cpu.loadProgram(source);
    this.programSource = source;
    this.sessionId = this.db.createSession();
    this.elapsedMs = 0;
    this.persistSeconds = 0;
    this.io?.emit('program_loaded', this.getFullState());
    return {...result, success: true};
  }

  getProgramSource() { return this.programSource; }
  getFullState() {
    return {sessionId: this.sessionId, cpu: this.cpu.getState(), traffic: this.traffic.getState(), programSource: this.programSource};
  }
  getAnalytics() { return this.db.getAnalyticsSummary(this.sessionId); }
  close() { this.pause(); this.endSession(); this.db.close(); }
}
