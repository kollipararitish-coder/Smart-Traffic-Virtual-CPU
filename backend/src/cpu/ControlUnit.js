/**
 * ControlUnit.js
 * Hardware Control Unit for Educational Virtual CPU
 * Decodes instructions, generates datapath control signals, and tracks execution stages.
 */

export class ControlUnit {
  /**
   * Generates control signals and datapath active elements based on current instruction and stage
   */
  static decodeAndGenerateSignals(instruction, registers) {
    if (!instruction) {
      return {
        signals: {},
        stageSignals: {
          FETCH: { activeComponents: ['PC', 'Memory', 'IR'], activeBuses: ['AddressBus', 'DataBus'], description: 'Fetch instruction from Memory[PC]' }
        }
      };
    }

    const { mnemonic, opcode, op1, op2 } = instruction;

    const baseSignals = {
      mnemonic,
      opcode,
      RegWrite: 0,
      MemRead: 0,
      MemWrite: 0,
      IORead: 0,
      IOWrite: 0,
      Branch: 0,
      ALUSrc: 'REG', // 'REG' or 'IMM'
      MemToReg: 0,
      ALUOp: null,
      BranchTaken: false
    };

    // Determine signals based on mnemonic and opcode
    switch (mnemonic) {
      case 'LOAD':
        baseSignals.RegWrite = 1;
        if (typeof op2 === 'number' && instruction.format.includes('[addr]')) {
          baseSignals.MemRead = 1;
          baseSignals.MemToReg = 1;
        }
        break;

      case 'STORE':
        baseSignals.MemWrite = 1;
        break;

      case 'MOV':
        baseSignals.RegWrite = 1;
        break;

      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'DIV':
      case 'INC':
      case 'DEC':
        baseSignals.RegWrite = 1;
        baseSignals.ALUOp = mnemonic;
        baseSignals.ALUSrc = typeof op2 === 'number' ? 'IMM' : 'REG';
        break;

      case 'AND':
      case 'OR':
      case 'XOR':
      case 'NOT':
        baseSignals.RegWrite = 1;
        baseSignals.ALUOp = mnemonic;
        baseSignals.ALUSrc = typeof op2 === 'number' ? 'IMM' : 'REG';
        break;

      case 'CMP':
        baseSignals.RegWrite = 0; // CMP only sets flags, does not write back
        baseSignals.ALUOp = 'CMP';
        baseSignals.ALUSrc = typeof op2 === 'number' ? 'IMM' : 'REG';
        break;

      case 'JMP':
        baseSignals.Branch = 1;
        baseSignals.BranchTaken = true;
        break;

      case 'JZ':
        baseSignals.Branch = 1;
        baseSignals.BranchTaken = registers.FLAGS.Z === 1;
        break;

      case 'JNZ':
        baseSignals.Branch = 1;
        baseSignals.BranchTaken = registers.FLAGS.Z === 0;
        break;

      case 'JC':
        baseSignals.Branch = 1;
        baseSignals.BranchTaken = registers.FLAGS.C === 1;
        break;

      case 'JN':
        baseSignals.Branch = 1;
        baseSignals.BranchTaken = registers.FLAGS.N === 1;
        break;

      case 'JGT':
        baseSignals.Branch = 1;
        baseSignals.BranchTaken = registers.FLAGS.Z === 0 && registers.FLAGS.N === registers.FLAGS.V;
        break;

      case 'JLT':
        baseSignals.Branch = 1;
        baseSignals.BranchTaken = registers.FLAGS.N !== registers.FLAGS.V;
        break;

      case 'IN':
        baseSignals.RegWrite = 1;
        baseSignals.IORead = 1;
        break;

      case 'OUT':
        baseSignals.IOWrite = 1;
        break;

      case 'WAIT':
      case 'NOP':
      case 'HALT':
      case 'IRQ':
      case 'IRET':
        break;
    }

    return baseSignals;
  }

  /**
   * Generates architectural visualization state for each of the 5 sequential instruction stages
   */
  static getStageVisuals(stage, instruction, registers, signals, runtimeData = {}) {
    switch (stage) {
      case 'FETCH':
        return {
          stage: 'FETCH',
          activeComponents: ['PC', 'AddressBus', 'Memory', 'DataBus', 'IR'],
          activeBuses: ['AddressBus', 'DataBus'],
          dataMovement: `PC (0x${instruction.address.toString(16).toUpperCase().padStart(4, '0')}) -> Address Bus -> Memory -> Instruction Register (IR)`,
          controlDescription: 'Control Unit increments PC and latches fetched opcode into Instruction Register'
        };

      case 'DECODE':
        return {
          stage: 'DECODE',
          activeComponents: ['IR', 'ControlUnit', 'Registers'],
          activeBuses: ['ControlBus'],
          dataMovement: `IR -> Control Unit (Mnemonic: ${instruction?.mnemonic || 'NONE'}, Opcode: 0x${(instruction?.opcode || 0).toString(16).toUpperCase()})`,
          controlDescription: 'Control Unit generates micro-operations, selects operand registers and asserts control signals'
        };

      case 'EXECUTE':
        return {
          stage: 'EXECUTE',
          activeComponents: signals.ALUOp ? ['Registers', 'ALU', 'Flags'] : ['ControlUnit', 'Registers'],
          activeBuses: ['InternalDataBus', 'ControlBus'],
          dataMovement: signals.ALUOp
            ? `Operands -> ALU -> Result (${runtimeData.aluResult ?? 'eval'}) -> Status Flags`
            : `Evaluating condition / calculating effective target address (Branch: ${signals.BranchTaken ? 'TAKEN' : 'NOT TAKEN'})`,
          controlDescription: signals.ALUOp
            ? `ALU executes ${signals.ALUOp} operation and updates Zero, Carry, Negative, Overflow flags`
            : 'Evaluation of branch conditions or address displacement calculation'
        };

      case 'MEMORY':
        return {
          stage: 'MEMORY',
          activeComponents: (signals.MemRead || signals.MemWrite || signals.IORead || signals.IOWrite)
            ? ['Memory', 'IOController', 'DataBus']
            : ['ControlUnit'],
          activeBuses: (signals.MemRead || signals.MemWrite || signals.IORead || signals.IOWrite)
            ? ['AddressBus', 'DataBus']
            : [],
          dataMovement: signals.IORead
            ? `I/O Port [0x${(instruction?.op2 || 0).toString(16).toUpperCase()}] -> Data Bus -> ${instruction?.op1}`
            : signals.IOWrite
            ? `${instruction?.op2} -> Data Bus -> I/O Port [0x${(instruction?.op1 || 0).toString(16).toUpperCase()}]`
            : signals.MemRead
            ? `Memory[0x${(instruction?.op2 || 0).toString(16).toUpperCase()}] -> Data Bus`
            : signals.MemWrite
            ? `${instruction?.op2} -> Data Bus -> Memory[0x${(instruction?.op1 || 0).toString(16).toUpperCase()}]`
            : 'No memory / I/O access required for this instruction',
          controlDescription: 'Memory access and Memory-Mapped I/O read/write bus operations'
        };

      case 'WRITEBACK':
        return {
          stage: 'WRITEBACK',
          activeComponents: signals.RegWrite ? ['Registers', 'InternalDataBus'] : ['ControlUnit'],
          activeBuses: signals.RegWrite ? ['InternalDataBus'] : [],
          dataMovement: signals.RegWrite
            ? `Result (${runtimeData.writebackValue ?? 'val'}) -> Destination Register ${instruction?.op1}`
            : 'No register write-back required',
          controlDescription: 'Commit updated register contents and clock cycle completion'
        };

      default:
        return { stage, activeComponents: [], activeBuses: [], dataMovement: '', controlDescription: '' };
    }
  }
}
