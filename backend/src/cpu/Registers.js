/**
 * Registers.js
 * Hardware Register Organization for Educational Virtual CPU
 */

export class Registers {
  constructor() {
    this.reset();
  }

  reset() {
    // Program Counter - 16-bit address pointing to the next instruction
    this.PC = 0x0020; // Default user program start address

    // Instruction Register - holds the instruction currently being executed
    this.IR = null;

    // Accumulator - primary arithmetic & logic working register
    this.ACC = 0;

    // General Purpose Registers (16-bit integer values 0x0000 - 0xFFFF)
    this.R0 = 0;
    this.R1 = 0;
    this.R2 = 0;
    this.R3 = 0;

    // Stack Pointer - points to top of stack in memory (0x8000 - 0x8FFF)
    this.SP = 0x8FFF;

    // Architectural Status FLAGS
    this.FLAGS = {
      Z: 0, // Zero Flag: set if ALU result is 0
      C: 0, // Carry Flag: set if operation generated an unsigned carry or borrow
      N: 0, // Negative Flag: set if result is negative (MSB set)
      V: 0  // Overflow Flag: set if signed arithmetic overflow occurred
    };

    // Global Clock Cycle Counter
    this.CLOCK = 0;

    // Interrupt enable state
    this.IE = 1; // Interrupts enabled by default

    // Current Datapath Stage (FETCH, DECODE, EXECUTE, MEMORY, WRITEBACK)
    this.STAGE = 'FETCH';
  }

  get(name) {
    if (name === 'FLAGS') return { ...this.FLAGS };
    if (Object.prototype.hasOwnProperty.call(this, name)) {
      return this[name];
    }
    throw new Error(`Invalid register: ${name}`);
  }

  set(name, value) {
    if (name === 'FLAGS') {
      this.FLAGS = { ...this.FLAGS, ...value };
      return;
    }
    if (['PC', 'ACC', 'R0', 'R1', 'R2', 'R3', 'SP'].includes(name)) {
      // 16-bit masking
      this[name] = ((value % 65536) + 65536) % 65536;
      return;
    }
    if (name === 'IR' || name === 'STAGE' || name === 'CLOCK' || name === 'IE') {
      this[name] = value;
      return;
    }
    throw new Error(`Cannot write to unknown register: ${name}`);
  }

  setFlag(flag, val) {
    if (this.FLAGS[flag] !== undefined) {
      this.FLAGS[flag] = val ? 1 : 0;
    }
  }

  serialize() {
    return {
      PC: this.PC,
      IR: this.IR,
      ACC: this.ACC,
      R0: this.R0,
      R1: this.R1,
      R2: this.R2,
      R3: this.R3,
      SP: this.SP,
      FLAGS: { ...this.FLAGS },
      CLOCK: this.CLOCK,
      IE: this.IE,
      STAGE: this.STAGE
    };
  }
}
