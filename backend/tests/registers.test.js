/**
 * registers.test.js
 * Unit tests for Virtual CPU Register Organization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Registers } from '../src/cpu/Registers.js';

describe('CPU Registers & Architecture', () => {
  let registers;

  beforeEach(() => {
    registers = new Registers();
  });

  it('initializes with documented architectural default states', () => {
    expect(registers.PC).toBe(0x0020);
    expect(registers.ACC).toBe(0);
    expect(registers.R0).toBe(0);
    expect(registers.R1).toBe(0);
    expect(registers.R2).toBe(0);
    expect(registers.R3).toBe(0);
    expect(registers.SP).toBe(0x8FFF);
    expect(registers.FLAGS).toEqual({ Z: 0, C: 0, N: 0, V: 0 });
    expect(registers.CLOCK).toBe(0);
    expect(registers.IE).toBe(1);
    expect(registers.STAGE).toBe('FETCH');
  });

  it('correctly sets and gets register values with 16-bit masking', () => {
    registers.set('R0', 500);
    expect(registers.get('R0')).toBe(500);

    // Test 16-bit overflow wrapping (0x10005 -> 0x0005)
    registers.set('R1', 65541);
    expect(registers.get('R1')).toBe(5);

    // Negative wrapping to 16-bit unsigned representation
    registers.set('R2', -1);
    expect(registers.get('R2')).toBe(65535);
  });

  it('updates architectural status flags accurately', () => {
    registers.setFlag('Z', 1);
    registers.setFlag('C', 1);
    registers.setFlag('N', 0);
    registers.setFlag('V', 1);

    expect(registers.FLAGS.Z).toBe(1);
    expect(registers.FLAGS.C).toBe(1);
    expect(registers.FLAGS.N).toBe(0);
    expect(registers.FLAGS.V).toBe(1);
  });

  it('resets all registers to initial state', () => {
    registers.set('ACC', 42);
    registers.set('R3', 99);
    registers.setFlag('Z', 1);
    registers.CLOCK = 150;

    registers.reset();

    expect(registers.ACC).toBe(0);
    expect(registers.R3).toBe(0);
    expect(registers.FLAGS.Z).toBe(0);
    expect(registers.CLOCK).toBe(0);
    expect(registers.PC).toBe(0x0020);
  });
});
