/**
 * alu.test.js
 * Unit tests for Virtual CPU Arithmetic Logic Unit (ALU)
 */

import { describe, it, expect } from 'vitest';
import { ALU } from '../src/cpu/ALU.js';

describe('ALU Operations and Flag Updates', () => {
  it('correctly executes ADD and sets Zero / Carry / Overflow flags', () => {
    // Normal addition
    const res1 = ALU.add(15, 25);
    expect(res1.result).toBe(40);
    expect(res1.flags).toEqual({ Z: 0, C: 0, N: 0, V: 0 });

    // Zero result
    const res2 = ALU.add(0, 0);
    expect(res2.result).toBe(0);
    expect(res2.flags.Z).toBe(1);

    // Unsigned Carry (overflow past 16-bit 0xFFFF = 65535)
    const res3 = ALU.add(65535, 1);
    expect(res3.result).toBe(0);
    expect(res3.flags.Z).toBe(1);
    expect(res3.flags.C).toBe(1);

    // Signed overflow: 30000 + 30000 = 60000 (MSB set, positive + positive -> negative)
    const res4 = ALU.add(30000, 30000);
    expect(res4.flags.V).toBe(1);
    expect(res4.flags.N).toBe(1);
  });

  it('correctly executes SUB and CMP operations', () => {
    const res1 = ALU.sub(50, 20);
    expect(res1.result).toBe(30);
    expect(res1.flags.Z).toBe(0);
    expect(res1.flags.N).toBe(0);

    // Equal comparison -> Zero flag set
    const res2 = ALU.cmp(100, 100);
    expect(res2.result).toBe(0);
    expect(res2.flags.Z).toBe(1);

    // Smaller - Larger -> Borrow (Carry = 1) and Negative (N = 1)
    const res3 = ALU.sub(10, 20);
    expect(res3.flags.C).toBe(1);
    expect(res3.flags.N).toBe(1);
  });

  it('correctly executes MUL and 16-bit overflow', () => {
    const res1 = ALU.mul(12, 12);
    expect(res1.result).toBe(144);
    expect(res1.flags.Z).toBe(0);

    const res2 = ALU.mul(1000, 100); // 100000 > 65535
    expect(res2.flags.C).toBe(1);
    expect(res2.flags.V).toBe(1);
  });

  it('safely handles DIV including division by zero', () => {
    // Normal division
    const res1 = ALU.div(100, 4);
    expect(res1.result).toBe(25);
    expect(res1.flags.Z).toBe(0);

    // Division by zero safety
    const res2 = ALU.div(50, 0);
    expect(res2.result).toBe(0);
    expect(res2.flags.V).toBe(1);
    expect(res2.error).toBe('DIVISION_BY_ZERO');
  });

  it('executes bitwise operations: AND, OR, XOR, NOT', () => {
    expect(ALU.and(0b1100, 0b1010).result).toBe(0b1000);
    expect(ALU.or(0b1100, 0b1010).result).toBe(0b1110);
    expect(ALU.xor(0b1100, 0b1010).result).toBe(0b0110);

    const notRes = ALU.not(0);
    expect(notRes.result).toBe(0xFFFF);
    expect(notRes.flags.N).toBe(1);
  });

  it('executes INC and DEC', () => {
    const incRes = ALU.inc(99);
    expect(incRes.result).toBe(100);

    const decRes = ALU.dec(100);
    expect(decRes.result).toBe(99);
  });
});

it('MUL distinguishes signed overflow from unsigned carry', () => {
  expect(ALU.mul(20000,2).flags).toMatchObject({C:0,V:1});
  expect(ALU.mul(65535,2).flags).toMatchObject({C:1,V:0});
});
