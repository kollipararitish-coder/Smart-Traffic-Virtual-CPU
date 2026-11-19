/**
 * interrupt.test.js
 * Unit tests for Hardware Interrupt System, Vector Table, and ISR Return
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CPU } from '../src/cpu/CPU.js';

describe('Interrupt System & ISR Handling', () => {
  let cpu;

  beforeEach(() => {
    cpu = new CPU();
  });

  it('correctly saves PC and FLAGS to stack, executes ISR, and restores state via IRET', () => {
    const asm = `
      ORG 0x0020
      LOAD R0, #10
      LOAD R1, #20
      ADD R0, R1      ; R0 = 30
      HALT

      ORG 0x0200
      EMERGENCY_ISR:
      LOAD R3, #999   ; ISR payload execution
      IRET
    `;
    cpu.loadProgram(asm);

    // Execute first instruction: LOAD R0, #10
    cpu.step();
    expect(cpu.registers.R0).toBe(10);

    const initialSP = cpu.registers.SP;

    // Trigger hardware interrupt IRQ vector 0x0004
    cpu.triggerInterrupt(0x0004, { type: 'EMERGENCY' });

    // Next step will process the interrupt at instruction boundary
    expect(cpu.interruptController.inService).toBe(true);
    // Stack pointer decremented twice (PC and FLAGS pushed)
    expect(cpu.registers.SP).toBe(initialSP - 2);
    // PC jumped to ISR origin 0x0200
    expect(cpu.registers.PC).toBe(0x0200);

    // Step ISR instruction: LOAD R3, #999
    cpu.step();
    expect(cpu.registers.R3).toBe(999);

    // Step IRET
    cpu.step();
    // After IRET, SP restored to initialSP
    expect(cpu.registers.SP).toBe(initialSP);
    expect(cpu.interruptController.inService).toBe(false);

    // Continue normal program: LOAD R1, #20
    cpu.step();
    expect(cpu.registers.R1).toBe(20);

    // Step ADD R0, R1 -> 30
    cpu.step();
    expect(cpu.registers.R0).toBe(30);
  });
});
