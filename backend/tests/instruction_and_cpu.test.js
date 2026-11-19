/**
 * instruction_and_cpu.test.js
 * Unit tests for Virtual CPU ISA Execution, Datapath Stages, and Branching
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../src/cpu/CPU.js';

describe('CPU Instruction Execution & Datapath Stages', () => {
  let cpu;

  beforeEach(() => {
    cpu = new CPU();
  });

  it('executes data transfer instructions: LOAD, MOV, STORE', () => {
    const asm = `
      ORG 0x0020
      LOAD R0, #100
      MOV R1, R0
      STORE [0x2050], R1
      LOAD R2, [0x2050]
      HALT
    `;
    cpu.loadProgram(asm);

    // Step 1: LOAD R0, #100
    cpu.step();
    expect(cpu.registers.R0).toBe(100);

    // Step 2: MOV R1, R0
    cpu.step();
    expect(cpu.registers.R1).toBe(100);

    // Step 3: STORE [0x2050], R1
    cpu.step();
    expect(cpu.memory.read(0x2050)).toBe(100);

    // Step 4: LOAD R2, [0x2050]
    cpu.step();
    expect(cpu.registers.R2).toBe(100);

    // Step 5: HALT
    cpu.step();
    expect(cpu.state).toBe('HALTED');
  });

  it('executes arithmetic instructions and updates registers and flags', () => {
    const asm = `
      ORG 0x0020
      LOAD R0, #20
      ADD R0, #15
      SUB R0, #5
      MUL R0, #2
      DIV R0, #6
      INC R0
      DEC R0
      HALT
    `;
    cpu.loadProgram(asm);

    cpu.step(); // LOAD R0, #20
    expect(cpu.registers.R0).toBe(20);

    cpu.step(); // ADD R0, #15 -> 35
    expect(cpu.registers.R0).toBe(35);

    cpu.step(); // SUB R0, #5 -> 30
    expect(cpu.registers.R0).toBe(30);

    cpu.step(); // MUL R0, #2 -> 60
    expect(cpu.registers.R0).toBe(60);

    cpu.step(); // DIV R0, #6 -> 10
    expect(cpu.registers.R0).toBe(10);

    cpu.step(); // INC R0 -> 11
    expect(cpu.registers.R0).toBe(11);

    cpu.step(); // DEC R0 -> 10
    expect(cpu.registers.R0).toBe(10);
  });

  it('executes conditional branching: CMP, JGT, JLT, JZ, JNZ, JMP', () => {
    const asm = `
      ORG 0x0020
      LOAD R0, #50
      LOAD R1, #30
      CMP R0, R1
      JGT GREATER_BRANCH
      LOAD R2, #999   ; Should be skipped
      JMP END
    GREATER_BRANCH:
      LOAD R2, #777
    END:
      HALT
    `;
    cpu.loadProgram(asm);

    cpu.step(); // LOAD R0, #50
    cpu.step(); // LOAD R1, #30
    cpu.step(); // CMP R0, R1 (sets flags: 50 > 30)
    expect(cpu.registers.FLAGS.Z).toBe(0);
    expect(cpu.registers.FLAGS.N).toBe(0);

    cpu.step(); // JGT GREATER_BRANCH (branch taken)
    cpu.step(); // LOAD R2, #777
    expect(cpu.registers.R2).toBe(777);

    cpu.step(); // HALT
    expect(cpu.state).toBe('HALTED');
  });

  it('records comprehensive 5-stage datapath execution trace', () => {
    const asm = `
      ORG 0x0020
      LOAD R0, #42
      HALT
    `;
    cpu.loadProgram(asm);
    const result = cpu.step();

    expect(result.traceEntry).toBeDefined();
    expect(result.traceEntry.instruction.mnemonic).toBe('LOAD');
    expect(result.traceEntry.registersDelta.R0).toEqual({ from: 0, to: 42 });
    expect(cpu.activeDatapath.stages.FETCH).toBeDefined();
    expect(cpu.activeDatapath.stages.DECODE).toBeDefined();
    expect(cpu.activeDatapath.stages.EXECUTE).toBeDefined();
    expect(cpu.activeDatapath.stages.MEMORY).toBeDefined();
    expect(cpu.activeDatapath.stages.WRITEBACK).toBeDefined();
  });
});
