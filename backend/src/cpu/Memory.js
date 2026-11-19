/**
 * Memory.js
 * 65,536-slot Unified Memory & Memory-Mapped I/O System for Educational Virtual CPU
 */

export const IO_MAP = {
  // Sensor Inputs (Read-only from CPU perspective, updated by Traffic Simulation)
  NORTH_COUNT: 0xF000,
  SOUTH_COUNT: 0xF001,
  EAST_COUNT:  0xF002,
  WEST_COUNT:  0xF003,

  // Traffic Light Actuators (0 = RED, 1 = YELLOW, 2 = GREEN)
  NORTH_SIGNAL: 0xF010,
  SOUTH_SIGNAL: 0xF011,
  EAST_SIGNAL:  0xF012,
  WEST_SIGNAL:  0xF013,

  // Emergency & System Registers
  EMERGENCY_STATUS: 0xF020, // 0 = None, 1 = North, 2 = South, 3 = East, 4 = West
  EMERGENCY_ACK:    0xF021, // Write 1 to clear active emergency
  SYS_TICK:         0xF030  // Global cycle/tick reference
};

export class Memory {
  constructor(size = 0x10000) {
    this.size = size; // 65536 entries
    this.rawMemory = new Array(size).fill(0);

    // Dedicated I/O register map
    this.ioRegisters = {
      [IO_MAP.NORTH_COUNT]: 0,
      [IO_MAP.SOUTH_COUNT]: 0,
      [IO_MAP.EAST_COUNT]: 0,
      [IO_MAP.WEST_COUNT]: 0,
      [IO_MAP.NORTH_SIGNAL]: 0, // 0 = RED
      [IO_MAP.SOUTH_SIGNAL]: 0,
      [IO_MAP.EAST_SIGNAL]: 0,
      [IO_MAP.WEST_SIGNAL]: 0,
      [IO_MAP.EMERGENCY_STATUS]: 0,
      [IO_MAP.EMERGENCY_ACK]: 0,
      [IO_MAP.SYS_TICK]: 0
    };

    // Callback handlers for I/O operations
    this.ioReadHandlers = new Map();
    this.ioWriteHandlers = new Map();

    // Default Interrupt Vectors
    this.rawMemory[0x0000] = 0x0020; // Reset Vector points to 0x0020
    this.rawMemory[0x0004] = 0x0200; // Emergency ISR Vector points to 0x0200
  }

  isIOAddress(address) {
    return (address & 0xFF00) === 0xF000;
  }

  setIOReadHandler(port, handler) {
    this.ioReadHandlers.set(port, handler);
  }

  setIOWriteHandler(port, handler) {
    this.ioWriteHandlers.set(port, handler);
  }

  read(address) {
    const addr = address & 0xFFFF;
    if (this.isIOAddress(addr)) {
      if (this.ioReadHandlers.has(addr)) {
        const val = this.ioReadHandlers.get(addr)();
        this.ioRegisters[addr] = val & 0xFFFF;
        return val & 0xFFFF;
      }
      return (this.ioRegisters[addr] || 0) & 0xFFFF;
    }
    const val = this.rawMemory[addr];
    return val !== undefined ? val : 0;
  }

  write(address, value) {
    const addr = address & 0xFFFF;
    const val = typeof value === 'number' ? (value & 0xFFFF) : value;

    if (this.isIOAddress(addr)) {
      if (this.ioWriteHandlers.has(addr)) this.ioWriteHandlers.get(addr)(val);
      this.ioRegisters[addr] = typeof val === 'number' ? val : 0;
      return;
    }

    this.rawMemory[addr] = val;
  }

  readIO(port) {
    return this.read(port);
  }

  writeIO(port, value) {
    this.write(port, value);
  }

  reset() {
    this.rawMemory.fill(0);
    for (const key of Object.keys(this.ioRegisters)) {
      this.ioRegisters[key] = 0;
    }
    this.rawMemory[0x0000] = 0x0020;
    this.rawMemory[0x0004] = 0x0200;
  }

  dumpIO() {
    for (const port of this.ioReadHandlers.keys()) this.readIO(port);
    return { ...this.ioRegisters };
  }

  dumpRange(start, length) {
    const s = Math.max(0, start & 0xFFFF);
    const l = Math.min(length, this.size - s);
    const out = [];
    for (let i = 0; i < l; i++) {
      out.push({
        address: s + i,
        hexAddress: '0x' + (s + i).toString(16).toUpperCase().padStart(4, '0'),
        value: this.read(s + i)
      });
    }
    return out;
  }
}
