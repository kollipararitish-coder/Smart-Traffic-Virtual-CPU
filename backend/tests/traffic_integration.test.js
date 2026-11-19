/**
 * traffic_integration.test.js
 * Integration tests connecting Virtual CPU, Traffic Simulation, and Emergency Preemption
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../src/cpu/CPU.js';
import { TrafficController } from '../src/traffic/TrafficController.js';
import { DEFAULT_TRAFFIC_PROGRAM } from '../src/traffic/TrafficProgram.js';

describe('Traffic Controller & Virtual CPU Integration', () => {
  let cpu;
  let traffic;

  beforeEach(() => {
    cpu = new CPU();
    traffic = new TrafficController(cpu);
    cpu.loadProgram(DEFAULT_TRAFFIC_PROGRAM);
  });

  it('CPU reads live queue sensors from Memory-Mapped I/O ports', () => {
    traffic.queues.North = [{}, {}, {}]; // 3 cars
    traffic.queues.South = [{}];          // 1 car

    expect(cpu.memory.readIO(0xF000)).toBe(3);
    expect(cpu.memory.readIO(0xF001)).toBe(1);
  });

  it('CPU output instructions directly actuate physical traffic lights', () => {
    // Write 2 (GREEN) to North signal 0xF010
    cpu.memory.writeIO(0xF010, 2);
    expect(traffic.signals.North).toBe(2);

    // Write 1 (YELLOW) to North signal
    cpu.memory.writeIO(0xF010, 1);
    expect(traffic.signals.North).toBe(1);

    // Write 0 (RED) to North signal
    cpu.memory.writeIO(0xF010, 0);
    expect(traffic.signals.North).toBe(0);
  });

  it('vehicles depart when traffic signal is green during simulation ticks', () => {
    traffic.spawnRates.North = 0; // Disable random arrivals for deterministic test
    traffic.queues.North = [
      { id: 101, entryTime: Date.now() - 5000, type: 'car' },
      { id: 102, entryTime: Date.now() - 2000, type: 'car' }
    ];
    traffic.signals.North = 2; // GREEN

    traffic.tick();

    expect(traffic.queues.North.length).toBe(1);
    expect(traffic.stats.totalPassed).toBe(1);
  });

  it('handles emergency interrupt preemption through ISR', () => {
    // Inject emergency vehicle on East approach
    traffic.triggerEmergency('East');

    expect(traffic.activeEmergency).toBeDefined();
    expect(traffic.activeEmergency.direction).toBe('East');
    expect(cpu.interruptController.inService).toBe(true);
    expect(cpu.registers.PC).toBe(0x0200); // PC successfully transferred to ISR vector target

    // ISR now preserves its working register and warns/clears before selecting East.
    let sawEastGreen = false;
    for (let i=0; i<500 && cpu.interruptController.inService; i++) {
      cpu.step();
      if (traffic.signals.East === 2) sawEastGreen = true;
    }
    expect(sawEastGreen).toBe(true);
    expect(cpu.interruptController.inService).toBe(false);
    expect(cpu.registers.R0).toBe(0);
  });
});
