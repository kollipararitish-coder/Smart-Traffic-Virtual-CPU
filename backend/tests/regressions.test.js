import {describe, it, expect, afterEach, vi} from 'vitest';
import {CPU} from '../src/cpu/CPU.js';
import {Assembler} from '../src/cpu/Assembler.js';
import {TrafficController} from '../src/traffic/TrafficController.js';
import {DEFAULT_TRAFFIC_PROGRAM} from '../src/traffic/TrafficProgram.js';
import {SimulationService} from '../src/services/SimulationService.js';
import {Database} from '../src/database/database.js';

const services = [];
function service() {
  const s = new SimulationService(null, new Database(':memory:'));
  for (const dir of s.traffic.directions) s.traffic.setSpawnRate(dir, 0);
  services.push(s);
  return s;
}
afterEach(() => { for (const s of services.splice(0)) s.close(); vi.useRealTimers(); });

describe('Assembler validation and execution contracts', () => {
  it.each(['LOAD R9, #1', 'LOAD R0, #12abc', 'LOAD R0, #0xZZ', 'ADD R0, #1, #2',
    'HALT R0', 'WAIT #-1', 'WAIT #0', 'IN R0, [12]', 'ORG 65536\nNOP',
    'ORG 0x20\nNOP\nORG 0x20\nHALT', 'A: NOP\nA: HALT', '; comments only', 'STORE [2], Nope'])('rejects invalid program %s', source => {
    expect(() => Assembler.assemble(source)).toThrow();
  });
  it('uses first ORG entry and normalizes register case', () => {
    const cpu = new CPU(); cpu.loadProgram('ORG 0x100\nLOAD r0, #7\nHALT');
    expect(cpu.registers.PC).toBe(0x100); cpu.step(); expect(cpu.registers.R0).toBe(7);
    expect(cpu.registers.CLOCK).toBe(5); expect(cpu.currentInstruction.cycles).toBe(5);
  });
  it('HALT cannot be bypassed by pause/resume', () => {
    const cpu = new CPU(); cpu.loadProgram('HALT'); cpu.step(); cpu.pause();
    expect(cpu.state).toBe('HALTED'); expect(() => cpu.start()).toThrow();
  });
  it('IRET without an ISR is rejected', () => {
    const cpu = new CPU(); cpu.loadProgram('IRET'); expect(() => cpu.step()).toThrow(/IRET/);
  });
});

describe('Emergency restoration', () => {
  it.each(['North','South','East','West'])('preempts WAIT and restores context after %s emergency', dir => {
    const cpu = new CPU(); const traffic = new TrafficController(cpu);
    cpu.loadProgram(DEFAULT_TRAFFIC_PROGRAM);
    for (let i = 0; i < 100 && cpu.waitCounter === 0; i++) cpu.step();
    const before = {pc:cpu.registers.PC, r0:cpu.registers.R0, flags:{...cpu.registers.FLAGS}, wait:cpu.waitCounter, signals:{...traffic.signals}, sp:cpu.registers.SP};
    traffic.triggerEmergency(dir);
    expect(cpu.waitCounter).toBe(0);
    expect(cpu.step().traceEntry.instruction.mnemonic).toBe('STORE');
    let sawGreen = false;
    for (let i=0;i<500 && cpu.interruptController.inService;i++) {
      cpu.step();
      if (traffic.signals[dir] === 2) sawGreen = true;
      expect(Object.values(traffic.signals).filter(v => v===2).length).toBeLessThanOrEqual(1);
    }
    expect(sawGreen).toBe(true); expect(cpu.interruptController.inService).toBe(false);
    expect(cpu.registers.R0).toBe(before.r0); expect(cpu.registers.FLAGS).toEqual(before.flags);
    expect(cpu.registers.PC).toBe(before.pc); expect(cpu.registers.SP).toBe(before.sp);
    expect(cpu.waitCounter).toBe(before.wait); expect(traffic.signals).toEqual(before.signals);
    expect(traffic.activeEmergency).toBeNull();
  });
  it('does not overwrite an in-flight emergency', () => {
    const s = service(); s.triggerEmergency('North');
    expect(() => s.triggerEmergency('East')).toThrow(/already/);
    expect(s.traffic.activeEmergency.direction).toBe('North');
  });
  it('rejects an emergency for programs without an ISR', () => {
    const s = service(); s.loadCustomProgram('NOP\nHALT');
    expect(() => s.triggerEmergency('West')).toThrow(/ISR/);
  });
});

describe('Simulation lifecycle and persistence', () => {
  it('logs continuous execution once per instruction and stops on HALT', () => {
    vi.useFakeTimers(); const s = service(); s.loadCustomProgram('LOAD R0, #4\nADD R0, #3\nHALT');
    s.start(); vi.advanceTimersByTime(500);
    expect(s.cpu.registers.R0).toBe(7); expect(s.cpu.state).toBe('HALTED');
    expect(s.getAnalytics().cpuStats.totalLogged).toBe(3);
    expect(s.simulationLoopTimer).toBeNull();
  });
  it('single steps and continuous run advance the same CPU and traffic time', () => {
    vi.useFakeTimers(); const a = service(), b = service();
    for (let i=0;i<40;i++) a.step();
    b.start(); vi.advanceTimersByTime(4000); b.pause();
    expect(b.cpu.registers.serialize()).toEqual(a.cpu.registers.serialize());
    expect(b.traffic.simulationTime).toBeCloseTo(a.traffic.simulationTime,8);
    const av=a.traffic.getState().vehicles, bv=b.traffic.getState().vehicles;
    expect(bv.length).toBe(av.length);
    av.forEach((v,i) => { expect(bv[i].id).toBe(v.id); expect(bv[i].distanceFromStopLine).toBeCloseTo(v.distanceFromStopLine,8); expect(bv[i].hasCrossed).toBe(v.hasCrossed); });
  });
  it('speed changes do not create a second CPU timer', () => {
    vi.useFakeTimers(); const s = service(); s.start(); s.setSpeed(20); vi.advanceTimersByTime(100);
    expect(s.cpu.instructionCount).toBe(5); expect(s.cpu.timer).toBeNull();
  });
  it('saves totals before reset and reseeds the original queues', () => {
    const s = service(); const old = s.sessionId; s.step(); s.step();
    s.traffic.stats.totalPassed = 3; s.reset();
    const previous = s.db.getAnalyticsSummary(old).session;
    expect(previous.total_instructions).toBe(2); expect(previous.total_cycles).toBe(10);
    expect(previous.total_vehicles_passed).toBe(3); expect(s.cpu.instructionCount).toBe(0);
    expect(s.traffic.getState().counts).toEqual({North:4,South:3,East:5,West:2});
  });
  it('invalid assembly keeps the last valid source and state', () => {
    const s = service(); s.step(); const before = s.getFullState();
    expect(() => s.loadCustomProgram('LOAD R7, #1')).toThrow();
    expect(s.programSource).toBe(before.programSource); expect(s.sessionId).toBe(before.sessionId);
    expect(s.cpu.registers.PC).toBe(before.cpu.registers.PC); expect(() => s.reset()).not.toThrow();
  });
  it('records emergency completion only after ACK', () => {
    const s = service(); s.triggerEmergency('North');
    expect(s.getAnalytics().emergencyEvents[0].clear_time).toBeNull();
    for(let i=0;i<500 && s.cpu.interruptController.inService;i++) s.step();
    expect(s.getAnalytics().emergencyEvents[0].clear_time).not.toBeNull();
  });
  it('turns signals red and halts on a conflicting custom program', () => {
    const s = service(); s.loadCustomProgram('OUT [0xF010], #2\nOUT [0xF012], #2\nHALT');
    s.step(); expect(() => s.step()).toThrow(/Conflicting/);
    expect(s.cpu.state).toBe('HALTED'); expect(Object.values(s.traffic.signals)).toEqual([0,0,0,0]);
  });
  it('rejects manual stepping during continuous execution', () => {
    vi.useFakeTimers(); const s = service(); s.start(); expect(() => s.step()).toThrow(/Pause/);
  });
});

describe('Traffic physics and sensors', () => {
  it('does not cross a red light even with a large timestep', () => {
    const s = service(); s.traffic.queues.North=[{id:99,distanceFromStopLine:55,speed:6}];
    s.traffic.tick(2); expect(s.traffic.queues.North[0].distanceFromStopLine).toBe(52);
    expect(s.traffic.stats.totalPassed).toBe(0);
  });
  it('maintains vehicle spacing under green', () => {
    const s = service(); s.traffic.queues.North=[{id:1,distanceFromStopLine:150,speed:3},{id:2,distanceFromStopLine:192,speed:6}];
    s.cpu.memory.writeIO(0xF010,2); s.traffic.tick(.5);
    const q=s.traffic.queues.North; expect(q[1].distanceFromStopLine-q[0].distanceFromStopLine).toBeGreaterThanOrEqual(42);
  });
  it('keeps bus front bumpers behind the red stop line', () => {
    const s=service(); s.traffic.queues.North=[{id:55,type:'BUS',distanceFromStopLine:80,speed:3.2}];
    s.traffic.tick(.5);
    expect(s.traffic.queues.North[0].distanceFromStopLine - 28).toBeGreaterThanOrEqual(30);
  });
  it('I/O dumps contain live queue counts and CPU clock', () => {
    const s=service(); s.step(); const io=s.cpu.memory.dumpIO();
    expect(io[0xF000]).toBe(s.traffic.queues.North.length); expect(io[0xF030]).toBe(s.cpu.registers.CLOCK);
  });
});
