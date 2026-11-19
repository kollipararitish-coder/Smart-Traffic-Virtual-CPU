/**
 * memory.test.js
 * Unit tests for Virtual CPU Memory & Memory-Mapped I/O
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Memory, IO_MAP } from '../src/cpu/Memory.js';

describe('Memory Organization and Memory-Mapped I/O', () => {
  let memory;

  beforeEach(() => {
    memory = new Memory();
  });

  it('reads and writes to general RAM addresses (0x0000 - 0xEFFF)', () => {
    memory.write(0x2000, 42);
    expect(memory.read(0x2000)).toBe(42);

    memory.write(0x5000, 1024);
    expect(memory.read(0x5000)).toBe(1024);
  });

  it('correctly maps and identifies I/O registers (0xF000 - 0xF0FF)', () => {
    expect(memory.isIOAddress(0xF000)).toBe(true);
    expect(memory.isIOAddress(0xF010)).toBe(true);
    expect(memory.isIOAddress(0x1000)).toBe(false);
  });

  it('supports I/O read and write callbacks for hardware simulation', () => {
    let mockSensorVal = 14;
    memory.setIOReadHandler(IO_MAP.NORTH_COUNT, () => mockSensorVal);

    expect(memory.readIO(IO_MAP.NORTH_COUNT)).toBe(14);

    let actuatorOutput = 0;
    memory.setIOWriteHandler(IO_MAP.NORTH_SIGNAL, (val) => { actuatorOutput = val; });

    memory.writeIO(IO_MAP.NORTH_SIGNAL, 2); // GREEN
    expect(actuatorOutput).toBe(2);
  });

  it('maintains default interrupt vectors in IVT', () => {
    expect(memory.read(0x0000)).toBe(0x0020); // Reset vector
    expect(memory.read(0x0004)).toBe(0x0200); // Emergency vector
  });
});
