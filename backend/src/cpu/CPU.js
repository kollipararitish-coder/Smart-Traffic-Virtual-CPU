/**
 * CPU.js
 * Master Virtual CPU Engine for Educational Computer Organization & Architecture
 * Implements five-stage sequential instruction cycle, architectural registers, ALU,
 * bus datapath representation, interrupts, and memory-mapped I/O.
 */

import { Registers } from './Registers.js';
import { ALU } from './ALU.js';
import { Memory, IO_MAP } from './Memory.js';
import { ControlUnit } from './ControlUnit.js';
import { InterruptController } from './InterruptController.js';
import { Assembler } from './Assembler.js';

export class CPU {
  constructor() {
    this.registers = new Registers();
    this.memory = new Memory();
    this.memory.setIOReadHandler(IO_MAP.SYS_TICK, () => this.registers.CLOCK);
    this.interruptController = new InterruptController(this.memory);

    this.state = 'HALTED'; // 'RUNNING', 'PAUSED', 'HALTED', 'WAITING'
    this.waitCounter = 0;
    this.suspendedWait = 0;
    this.currentStage = 'FETCH'; // FETCH, DECODE, EXECUTE, MEMORY, WRITEBACK
    this.currentInstruction = null;
    this.currentSignals = null;
    this.activeDatapath = null;

    this.executionHistory = [];
    this.maxHistorySize = 100;
    this.instructionCount = 0;
    this.instructionFrequency = {};

    this.timer = null;
    this.clockSpeedMs = 20; // 20ms per instruction cycle (Ultra Fast default)
    this.listeners = new Set();
  }

  onStateChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyStateChange() {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Error in CPU state listener:', err);
      }
    }
  }

  loadProgram(assemblySource) {
    const { program, symbols, entryPoint } = Assembler.assemble(assemblySource);

    this.pause();
    this.activeDatapath = null;
    this.lastError = null;

    // Reset memory and registers
    this.memory.reset();
    this.registers.reset();
    this.interruptController.reset();

    // Load instructions into program memory
    for (const instr of program) {
      this.memory.write(instr.address, instr);
    }

    // Set PC to entry point
    this.registers.PC = entryPoint;
    this.state = 'PAUSED';
    this.waitCounter = 0;
    this.suspendedWait = 0;
    this.currentStage = 'FETCH';
    this.currentInstruction = null;
    this.currentSignals = null;
    this.executionHistory = [];
    this.instructionCount = 0;
    this.instructionFrequency = {};

    this.notifyStateChange();
    return { count: program.length, symbols, entryPoint };
  }

  /**
   * Resolve an operand value (Register, Immediate, or Memory)
   */
  resolveOperand(op) {
    if (typeof op === 'number') return op;
    if (['ACC', 'R0', 'R1', 'R2', 'R3', 'PC', 'SP'].includes(op)) {
      return this.registers.get(op);
    }
    throw new Error(`Invalid operand: ${op}`);
  }

  /**
   * Execute a full 5-stage instruction cycle
   */
  step() {
    if (this.state === 'HALTED') {
      return { status: 'HALTED', reason: 'CPU is halted' };
    }

    // Handle WAIT instruction delay
    if (this.waitCounter > 0) {
      this.waitCounter--;
      this.registers.CLOCK++;
      this.notifyStateChange();
      return { status: 'WAITING', remainingWait: this.waitCounter };
    }

    const regSnapshotBefore = this.registers.serialize();
    const pcBefore = this.registers.PC;

    // --- STAGE 1: FETCH ---
    this.currentStage = 'FETCH';
    this.registers.STAGE = 'FETCH';
    const rawInstruction = this.memory.read(this.registers.PC);

    if (!rawInstruction || typeof rawInstruction !== 'object') {
      this.state = 'HALTED';
      this.notifyStateChange();
      return { status: 'HALTED', reason: `No valid instruction at address 0x${pcBefore.toString(16).toUpperCase()}` };
    }

    this.currentInstruction = { ...rawInstruction };
    this.registers.IR = this.currentInstruction;
    this.registers.PC = (this.registers.PC + 1) & 0xFFFF;
    this.registers.CLOCK++;

    const fetchVisuals = ControlUnit.getStageVisuals('FETCH', this.currentInstruction, this.registers, {});

    // --- STAGE 2: DECODE ---
    this.currentStage = 'DECODE';
    this.registers.STAGE = 'DECODE';
    const signals = ControlUnit.decodeAndGenerateSignals(this.currentInstruction, this.registers);
    this.currentSignals = signals;
    this.registers.CLOCK++;

    const decodeVisuals = ControlUnit.getStageVisuals('DECODE', this.currentInstruction, this.registers, signals);

    // --- STAGE 3: EXECUTE ---
    this.currentStage = 'EXECUTE';
    this.registers.STAGE = 'EXECUTE';
    this.registers.CLOCK++;

    let aluResult = null;
    let branchTaken = false;
    let effectiveTarget = null;

    const op1 = this.currentInstruction.op1;
    const op2 = this.currentInstruction.op2;

    if (signals.ALUOp) {
      const valA = this.resolveOperand(op1);
      const valB = op2 === undefined ? 0 : signals.ALUSrc === 'IMM' ? op2 : this.resolveOperand(op2);

      let aluOut;
      switch (signals.ALUOp) {
        case 'ADD': aluOut = ALU.add(valA, valB); break;
        case 'SUB': aluOut = ALU.sub(valA, valB); break;
        case 'MUL': aluOut = ALU.mul(valA, valB); break;
        case 'DIV': aluOut = ALU.div(valA, valB); break;
        case 'AND': aluOut = ALU.and(valA, valB); break;
        case 'OR':  aluOut = ALU.or(valA, valB); break;
        case 'XOR': aluOut = ALU.xor(valA, valB); break;
        case 'NOT': aluOut = ALU.not(valA); break;
        case 'CMP': aluOut = ALU.cmp(valA, valB); break;
        case 'INC': aluOut = ALU.inc(valA); break;
        case 'DEC': aluOut = ALU.dec(valA); break;
      }

      if (aluOut) {
        aluResult = aluOut.result;
        this.registers.set('FLAGS', aluOut.flags);
      }
    } else if (signals.Branch) {
      branchTaken = signals.BranchTaken;
      effectiveTarget = op1;
      if (branchTaken) {
        this.registers.PC = effectiveTarget & 0xFFFF;
      }
    }

    const executeVisuals = ControlUnit.getStageVisuals('EXECUTE', this.currentInstruction, this.registers, signals, { aluResult });

    // --- STAGE 4: MEMORY ACCESS ---
    this.currentStage = 'MEMORY';
    this.registers.STAGE = 'MEMORY';
    this.registers.CLOCK++;

    let memData = null;
    let ioAccess = null;

    if (this.currentInstruction.mnemonic === 'LOAD' && signals.MemRead) {
      memData = this.memory.read(op2);
      if (typeof memData !== 'number') throw new Error('Cannot load an instruction object as data');
    } else if (this.currentInstruction.mnemonic === 'STORE') {
      const srcVal = this.resolveOperand(op2);
      this.memory.write(op1, srcVal);
    } else if (this.currentInstruction.mnemonic === 'IN') {
      memData = this.memory.readIO(op2);
      ioAccess = { type: 'READ', port: op2, value: memData };
    } else if (this.currentInstruction.mnemonic === 'OUT') {
      const outVal = typeof op2 === 'number' ? op2 : this.resolveOperand(op2);
      this.memory.writeIO(op1, outVal);
      ioAccess = { type: 'WRITE', port: op1, value: outVal };
    }

    const memoryVisuals = ControlUnit.getStageVisuals('MEMORY', this.currentInstruction, this.registers, signals);

    // --- STAGE 5: WRITE BACK ---
    this.currentStage = 'WRITEBACK';
    this.registers.STAGE = 'WRITEBACK';
    this.registers.CLOCK++;

    let writebackValue = null;

    if (signals.RegWrite) {
      if (signals.ALUOp && signals.ALUOp !== 'CMP') {
        writebackValue = aluResult;
        this.registers.set(op1, writebackValue);
      } else if (this.currentInstruction.mnemonic === 'LOAD') {
        if (signals.MemRead) {
          writebackValue = memData;
        } else if (typeof op2 === 'number') {
          writebackValue = op2; // Immediate
        } else {
          writebackValue = this.resolveOperand(op2); // Register
        }
        this.registers.set(op1, writebackValue);
      } else if (this.currentInstruction.mnemonic === 'MOV') {
        writebackValue = typeof op2 === 'number' ? op2 : this.resolveOperand(op2);
        this.registers.set(op1, writebackValue);
      } else if (this.currentInstruction.mnemonic === 'IN') {
        writebackValue = memData;
        this.registers.set(op1, writebackValue);
      }
    } else if (this.currentInstruction.mnemonic === 'WAIT') {
      this.waitCounter = op1 - 1;
    } else if (this.currentInstruction.mnemonic === 'HALT') {
      this.state = 'HALTED';
    } else if (this.currentInstruction.mnemonic === 'IRQ') {
      // Software IRQ: Push FLAGS & PC, jump to vector
      this.triggerInterrupt(op1 || 0x0004);
    } else if (this.currentInstruction.mnemonic === 'IRET') {
      // Pop FLAGS & PC from stack
      this.returnFromInterrupt();
    }

    const writebackVisuals = ControlUnit.getStageVisuals('WRITEBACK', this.currentInstruction, this.registers, signals, { writebackValue });

    // Track active datapath state
    this.activeDatapath = {
      instruction: this.currentInstruction,
      signals,
      stages: {
        FETCH: fetchVisuals,
        DECODE: decodeVisuals,
        EXECUTE: executeVisuals,
        MEMORY: memoryVisuals,
        WRITEBACK: writebackVisuals
      }
    };

    // Calculate register delta
    const regSnapshotAfter = this.registers.serialize();
    const delta = {};
    for (const key of ['ACC', 'R0', 'R1', 'R2', 'R3', 'PC', 'SP']) {
      if (regSnapshotBefore[key] !== regSnapshotAfter[key]) {
        delta[key] = { from: regSnapshotBefore[key], to: regSnapshotAfter[key] };
      }
    }

    // Record Instruction Frequency
    const mnemonic = this.currentInstruction.mnemonic;
    this.instructionCount++;
    this.instructionFrequency[mnemonic] = (this.instructionFrequency[mnemonic] || 0) + 1;

    // Check Interrupt System at instruction boundary
    this.checkAndHandleInterrupt();

    // Record execution trace
    const traceEntry = {
      stepId: this.instructionCount,
      cycle: this.registers.CLOCK,
      pc: pcBefore,
      instruction: this.currentInstruction,
      signals,
      aluResult,
      flags: { ...this.registers.FLAGS },
      registersDelta: delta,
      ioAccess,
      timestamp: Date.now()
    };

    this.executionHistory.unshift(traceEntry);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.pop();
    }

    this.notifyStateChange();

    return {
      status: this.state,
      traceEntry,
      registers: this.registers.serialize()
    };
  }

  /**
   * Trigger hardware interrupt
   */
  triggerInterrupt(vector = 0x0004, payload = {}) {
    const target = this.memory.read(vector);
    if (!Number.isInteger(target) || typeof this.memory.read(target) !== 'object') throw new Error('Interrupt vector has no valid ISR');
    if (this.registers.SP < 0x8001 || this.registers.SP > 0x8FFF) throw new Error('Interrupt stack outside reserved range');
    this.interruptController.requestInterrupt(vector, payload);
    this.checkAndHandleInterrupt();
  }

  /**
   * Check interrupt controller and switch CPU context into ISR
   */
  checkAndHandleInterrupt() {
    if (this.registers.IE === 1 && this.interruptController.hasPending()) {
      const ack = this.interruptController.acknowledge();
      if (ack) {
        this.suspendedWait = this.waitCounter;
        this.waitCounter = 0;
        // Hardware interrupt entry:
        // Push current PC and FLAGS onto stack
        this.memory.write(this.registers.SP, this.registers.PC);
        this.registers.SP = (this.registers.SP - 1) & 0xFFFF;

        const flagsPacked = (this.registers.FLAGS.Z << 3) |
                            (this.registers.FLAGS.C << 2) |
                            (this.registers.FLAGS.N << 1) |
                            this.registers.FLAGS.V;
        this.memory.write(this.registers.SP, flagsPacked);
        this.registers.SP = (this.registers.SP - 1) & 0xFFFF;

        // Set PC to ISR address
        this.registers.PC = ack.isrAddress;
        this.registers.CLOCK += 4; // ISR entry cycle cost
      }
    }
  }

  /**
   * Return from interrupt (IRET)
   */
  returnFromInterrupt() {
    if (!this.interruptController.inService) throw new Error('IRET outside an interrupt handler');
    this.waitCounter = this.suspendedWait;
    this.suspendedWait = 0;
    // Pop FLAGS
    this.registers.SP = (this.registers.SP + 1) & 0xFFFF;
    const flagsPacked = this.memory.read(this.registers.SP);
    this.registers.FLAGS = {
      Z: (flagsPacked >> 3) & 1,
      C: (flagsPacked >> 2) & 1,
      N: (flagsPacked >> 1) & 1,
      V: flagsPacked & 1
    };

    // Pop PC
    this.registers.SP = (this.registers.SP + 1) & 0xFFFF;
    const restoredPC = this.memory.read(this.registers.SP);
    this.registers.PC = restoredPC;

    this.interruptController.returnFromInterrupt();
  }

  start(speedMs = null) {
    if (speedMs) this.clockSpeedMs = speedMs;
    if (this.state === 'HALTED') throw new Error('CPU halted: reset or load a program before running');
    if (this.state === 'RUNNING') return;
    this.state = 'RUNNING';

    const tick = () => {
      if (this.state !== 'RUNNING') return;
      try { this.step(); } catch (err) {
        this.state = 'HALTED';
        this.lastError = err.message;
        this.notifyStateChange();
      }
      if (this.state === 'RUNNING') {
        this.timer = setTimeout(tick, this.clockSpeedMs);
      }
    };

    this.timer = setTimeout(tick, this.clockSpeedMs);
    this.notifyStateChange();
  }

  pause() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.state !== 'HALTED') this.state = 'PAUSED';
    this.notifyStateChange();
  }

  resume() {
    this.start(this.clockSpeedMs);
  }

  reset() {
    this.pause();
    this.registers.reset();
    this.memory.reset();
    this.interruptController.reset();
    this.waitCounter = 0;
    this.suspendedWait = 0;
    this.currentStage = 'FETCH';
    this.currentInstruction = null;
    this.currentSignals = null;
    this.activeDatapath = null;
    this.lastError = null;
    this.executionHistory = [];
    this.instructionCount = 0;
    this.instructionFrequency = {};
    this.state = 'PAUSED';
    this.notifyStateChange();
  }

  setClockSpeed(speedMs) {
    if (!Number.isFinite(speedMs) || speedMs < 10 || speedMs > 2000) throw new Error('speedMs must be between 10 and 2000');
    this.clockSpeedMs = speedMs;
    if (this.state === 'RUNNING') {
      this.pause();
      this.start(this.clockSpeedMs);
    }
  }

  getState() {
    return {
      state: this.state,
      lastError: this.lastError || null,
      registers: this.registers.serialize(),
      currentInstruction: this.currentInstruction,
      currentSignals: this.currentSignals,
      currentStage: this.currentStage,
      waitCounter: this.waitCounter,
      clockSpeedMs: this.clockSpeedMs,
      instructionCount: this.instructionCount,
      instructionFrequency: { ...this.instructionFrequency },
      activeDatapath: this.activeDatapath,
      interruptState: this.interruptController.getState(),
      ioState: this.memory.dumpIO(),
      recentTrace: this.executionHistory.slice(0, 15)
    };
  }
}
