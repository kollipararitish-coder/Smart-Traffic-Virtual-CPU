/**
 * Assembler.js
 * Two-pass Assembler for Educational Virtual CPU Architecture
 * Converts human-readable Assembly instructions and labels into executable CPU structures.
 */

import { INSTRUCTIONS } from './InstructionSet.js';
import { IO_MAP } from './Memory.js';

export class Assembler {
  static assemble(sourceCode, origin = 0x0020) {
    const lines = sourceCode.split('\n');
    const symbols = { ...IO_MAP };
    const cleanedLines = [];
    const defined = new Set();

    // Pass 1: Parse symbols (EQU) and labels, calculate addresses
    let currentAddress = origin;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      let rawLine = lines[lineIndex].trim();
      // Remove comments starting with ; or //
      const commentIndex = rawLine.search(/;|(\/\/)/);
      if (commentIndex !== -1) {
        rawLine = rawLine.substring(0, commentIndex).trim();
      }

      if (!rawLine) continue;

      // Check for EQU definitions (e.g. THRESHOLD EQU 15)
      const equMatch = rawLine.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+EQU\s+(.+)$/i);
      if (equMatch) {
        const name = equMatch[1].trim();
        const valueExpr = equMatch[2].trim();
        if (defined.has(name)) throw new Error(`Line ${lineIndex + 1}: duplicate symbol ${name}`);
        defined.add(name);
        symbols[name] = this.parseImmediate(valueExpr, symbols);
        continue;
      }

      // Check for ORIGIN directive (e.g. ORG 0x0200)
      const orgMatch = rawLine.match(/^ORG\s+(.+)$/i);
      if (orgMatch) {
        currentAddress = this.parseImmediate(orgMatch[1].trim(), symbols);
        continue;
      }

      // Check for Labels (e.g. START: or START: LOAD R0, #10)
      const labelMatch = rawLine.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
      if (labelMatch) {
        const labelName = labelMatch[1].trim();
        if (defined.has(labelName)) throw new Error(`Line ${lineIndex + 1}: duplicate symbol ${labelName}`);
        defined.add(labelName);
        symbols[labelName] = currentAddress;
        const remainder = labelMatch[2].trim();
        if (remainder) {
          cleanedLines.push({
            address: currentAddress,
            lineText: remainder,
            lineNum: lineIndex + 1
          });
          currentAddress++;
        }
        continue;
      }

      cleanedLines.push({
        address: currentAddress,
        lineText: rawLine,
        lineNum: lineIndex + 1
      });
      currentAddress++;
    }

    // Pass 2: Generate instructions and resolve symbols
    const assembledProgram = [];
    const errors = [];

    const addresses = new Set();
    for (const item of cleanedLines) {
      try {
        if (!Number.isInteger(item.address) || item.address < 0x20 || item.address > 0xFFFF || (item.address >= 0xF000 && item.address <= 0xF0FF)) throw new Error('Program address is reserved or out of range');
        if (addresses.has(item.address)) throw new Error('Overlapping ORG regions');
        addresses.add(item.address);
        const instruction = this.parseInstructionLine(item.lineText, item.address, symbols);
        this.validateInstruction(instruction);
        assembledProgram.push({
          ...instruction,
          lineNum: item.lineNum,
          source: item.lineText
        });
      } catch (err) {
        errors.push(`Line ${item.lineNum}: ${err.message} in "${item.lineText}"`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Assembly failed with ${errors.length} error(s):\n${errors.join('\n')}`);
    }

    if (!assembledProgram.length) throw new Error('Program must contain at least one instruction');
    return {
      program: assembledProgram,
      symbols,
      entryPoint: assembledProgram[0].address
    };
  }

  static validateInstruction(instr) {
    const regs = ['ACC', 'R0', 'R1', 'R2', 'R3', 'PC', 'SP'];
    for (const op of [instr.op1, instr.op2]) {
      if (typeof op === 'string' && !regs.includes(op)) throw new Error(`Invalid register ${op}`);
      if (typeof op === 'number' && (!Number.isInteger(op) || op < -32768 || op > 65535)) throw new Error('Operand outside 16-bit range');
    }
    const {mnemonic:m, op1:a, op2:b} = instr;
    if (['LOAD','MOV','ADD','SUB','MUL','DIV','AND','OR','XOR','CMP','INC','DEC','NOT','IN'].includes(m) && !regs.includes(a)) throw new Error('Destination must be a register');
    const address = ['STORE','OUT','JMP','JZ','JNZ','JC','JN','JGT','JLT','IRQ'].includes(m) ? a : (m === 'IN' || instr.format === 'Rd, [addr]') ? b : null;
    if (address !== null && (!Number.isInteger(address) || address < 0 || address > 65535)) throw new Error('Invalid address');
    if (['IN','OUT'].includes(m) && (address < 0xF000 || address > 0xF0FF)) throw new Error('I/O port must be between 0xF000 and 0xF0FF');
    if (m === 'WAIT' && a < 1) throw new Error('WAIT must be at least 1');
  }

  static parseImmediate(valStr, symbols = {}) {
    valStr = valStr.trim();
    if (symbols[valStr] !== undefined) {
      return symbols[valStr];
    }
    if (valStr.startsWith('#')) return this.parseImmediate(valStr.slice(1), symbols);
    if (/^(?:0x[0-9a-f]+|-?\d+)$/i.test(valStr)) {
      const parsed = Number(valStr);
      if (Number.isSafeInteger(parsed)) return parsed;
    }
    throw new Error(`Unresolved symbol or invalid number: ${valStr}`);
  }

  static parseInstructionLine(line, address, symbols) {
    const parts = line.split(/\s+(.+)/);
    const mnemonic = parts[0].toUpperCase().trim();
    const operandStr = parts[1] ? parts[1].trim() : '';

    const operands = operandStr ? operandStr.split(',').map(s => s.trim()) : [];
    const counts = {LOAD:2, STORE:2, MOV:2, ADD:2, SUB:2, MUL:2, DIV:2,
      AND:2, OR:2, XOR:2, CMP:2, IN:2, OUT:2, INC:1, DEC:1, NOT:1,
      JMP:1, JZ:1, JNZ:1, JC:1, JN:1, JGT:1, JLT:1, WAIT:1, IRQ:1, NOP:0, IRET:0, HALT:0};
    if (counts[mnemonic] !== undefined && operands.length !== counts[mnemonic] &&
        !(['WAIT','IRQ'].includes(mnemonic) && operands.length === 0)) {
      throw new Error(`${mnemonic} expects ${counts[mnemonic]} operand(s)`);
    }
    for (let i = 0; i < operands.length; i++) {
      if (/^(ACC|R[0-3]|PC|SP)$/i.test(operands[i])) operands[i] = operands[i].toUpperCase();
    }

    switch (mnemonic) {
      // Data Transfer
      case 'LOAD': {
        const dest = operands[0];
        const src = operands[1];
        if (!dest || !src) throw new Error('LOAD requires two operands (Rd, [addr]|#imm|Rs)');

        if (src.startsWith('[') && src.endsWith(']')) {
          const inner = src.substring(1, src.length - 1).trim();
          const addr = this.parseImmediate(inner, symbols);
          return {
            address,
            opcode: INSTRUCTIONS.LOAD_MEM.opcode,
            mnemonic: 'LOAD',
            op1: dest,
            op2: addr,
            format: 'Rd, [addr]',
            cycles: INSTRUCTIONS.LOAD_MEM.cycles
          };
        } else if (src.startsWith('#')) {
          const imm = this.parseImmediate(src, symbols);
          return {
            address,
            opcode: INSTRUCTIONS.LOAD_IMM.opcode,
            mnemonic: 'LOAD',
            op1: dest,
            op2: imm,
            format: 'Rd, #imm',
            cycles: INSTRUCTIONS.LOAD_IMM.cycles
          };
        } else {
          return {
            address,
            opcode: INSTRUCTIONS.LOAD_REG.opcode,
            mnemonic: 'LOAD',
            op1: dest,
            op2: src,
            format: 'Rd, Rs',
            cycles: INSTRUCTIONS.LOAD_REG.cycles
          };
        }
      }

      case 'STORE': {
        const dest = operands[0];
        const src = operands[1];
        if (!dest || !src) throw new Error('STORE requires two operands ([addr], Rs)');
        if (!dest.startsWith('[') || !dest.endsWith(']')) {
          throw new Error('STORE destination must be an address in brackets: [addr]');
        }
        const inner = dest.substring(1, dest.length - 1).trim();
        const addr = this.parseImmediate(inner, symbols);
        return {
          address,
          opcode: INSTRUCTIONS.STORE.opcode,
          mnemonic: 'STORE',
          op1: addr,
          op2: src,
          format: '[addr], Rs',
          cycles: INSTRUCTIONS.STORE.cycles
        };
      }

      case 'MOV': {
        const dest = operands[0];
        const src = operands[1];
        if (!dest || !src) throw new Error('MOV requires two operands (Rd, Rs|#imm)');
        if (src.startsWith('#')) {
          const imm = this.parseImmediate(src, symbols);
          return {
            address,
            opcode: INSTRUCTIONS.MOV_IMM.opcode,
            mnemonic: 'MOV',
            op1: dest,
            op2: imm,
            format: 'Rd, #imm',
            cycles: INSTRUCTIONS.MOV_IMM.cycles
          };
        }
        return {
          address,
          opcode: INSTRUCTIONS.MOV.opcode,
          mnemonic: 'MOV',
          op1: dest,
          op2: src,
          format: 'Rd, Rs',
          cycles: INSTRUCTIONS.MOV.cycles
        };
      }

      // Arithmetic
      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'DIV': {
        const dest = operands[0];
        const src = operands[1];
        if (!dest || !src) throw new Error(`${mnemonic} requires two operands (Rd, Rs|#imm)`);
        const isImm = src.startsWith('#');
        const key = `${mnemonic}${isImm ? '_IMM' : ''}`;
        const instrDef = INSTRUCTIONS[key];
        const val2 = isImm ? this.parseImmediate(src, symbols) : src;
        return {
          address,
          opcode: instrDef.opcode,
          mnemonic,
          op1: dest,
          op2: val2,
          format: instrDef.format,
          cycles: instrDef.cycles
        };
      }

      case 'INC':
      case 'DEC': {
        const dest = operands[0];
        if (!dest) throw new Error(`${mnemonic} requires one operand (Rd)`);
        const instrDef = INSTRUCTIONS[mnemonic];
        return {
          address,
          opcode: instrDef.opcode,
          mnemonic,
          op1: dest,
          format: instrDef.format,
          cycles: instrDef.cycles
        };
      }

      // Logical
      case 'AND':
      case 'OR':
      case 'XOR': {
        const dest = operands[0];
        const src = operands[1];
        if (!dest || !src) throw new Error(`${mnemonic} requires two operands`);
        const isImm = src.startsWith('#');
        const key = `${mnemonic}${isImm ? '_IMM' : ''}`;
        const instrDef = INSTRUCTIONS[key];
        const val2 = isImm ? this.parseImmediate(src, symbols) : src;
        return {
          address,
          opcode: instrDef.opcode,
          mnemonic,
          op1: dest,
          op2: val2,
          format: instrDef.format,
          cycles: instrDef.cycles
        };
      }

      case 'NOT': {
        const dest = operands[0];
        if (!dest) throw new Error('NOT requires one operand (Rd)');
        return {
          address,
          opcode: INSTRUCTIONS.NOT.opcode,
          mnemonic: 'NOT',
          op1: dest,
          format: 'Rd',
          cycles: INSTRUCTIONS.NOT.cycles
        };
      }

      // Comparison
      case 'CMP': {
        const dest = operands[0];
        const src = operands[1];
        if (!dest || !src) throw new Error('CMP requires two operands (Rd, Rs|#imm)');
        const isImm = src.startsWith('#');
        const key = isImm ? 'CMP_IMM' : 'CMP';
        const instrDef = INSTRUCTIONS[key];
        const val2 = isImm ? this.parseImmediate(src, symbols) : src;
        return {
          address,
          opcode: instrDef.opcode,
          mnemonic: 'CMP',
          op1: dest,
          op2: val2,
          format: instrDef.format,
          cycles: instrDef.cycles
        };
      }

      // Branching
      case 'JMP':
      case 'JZ':
      case 'JNZ':
      case 'JC':
      case 'JN':
      case 'JGT':
      case 'JLT': {
        const target = operands[0];
        if (!target) throw new Error(`${mnemonic} requires a branch target address or label`);
        const targetAddr = this.parseImmediate(target, symbols);
        const instrDef = INSTRUCTIONS[mnemonic];
        return {
          address,
          opcode: instrDef.opcode,
          mnemonic,
          op1: targetAddr,
          format: 'addr',
          cycles: instrDef.cycles
        };
      }

      // I/O Instructions
      case 'IN': {
        const dest = operands[0];
        const port = operands[1];
        if (!dest || !port) throw new Error('IN requires Rd, [port]');
        let portVal = port;
        if (port.startsWith('[') && port.endsWith(']')) {
          portVal = port.substring(1, port.length - 1).trim();
        }
        const portAddr = this.parseImmediate(portVal, symbols);
        return {
          address,
          opcode: INSTRUCTIONS.IN.opcode,
          mnemonic: 'IN',
          op1: dest,
          op2: portAddr,
          format: 'Rd, [port]',
          cycles: INSTRUCTIONS.IN.cycles
        };
      }

      case 'OUT': {
        const port = operands[0];
        const src = operands[1];
        if (!port || !src) throw new Error('OUT requires [port], Rs|#imm');
        let portVal = port;
        if (port.startsWith('[') && port.endsWith(']')) {
          portVal = port.substring(1, port.length - 1).trim();
        }
        const portAddr = this.parseImmediate(portVal, symbols);
        const isImm = src.startsWith('#');
        const key = isImm ? 'OUT_IMM' : 'OUT';
        const instrDef = INSTRUCTIONS[key];
        const val = isImm ? this.parseImmediate(src, symbols) : src;
        return {
          address,
          opcode: instrDef.opcode,
          mnemonic: 'OUT',
          op1: portAddr,
          op2: val,
          format: instrDef.format,
          cycles: instrDef.cycles
        };
      }

      // Control
      case 'WAIT': {
        const cycles = operands[0] ? this.parseImmediate(operands[0], symbols) : 1;
        return {
          address,
          opcode: INSTRUCTIONS.WAIT.opcode,
          mnemonic: 'WAIT',
          op1: cycles,
          format: '#cycles',
          cycles: INSTRUCTIONS.WAIT.cycles
        };
      }

      case 'NOP': {
        return {
          address,
          opcode: INSTRUCTIONS.NOP.opcode,
          mnemonic: 'NOP',
          format: '',
          cycles: INSTRUCTIONS.NOP.cycles
        };
      }

      case 'IRQ': {
        const vector = operands[0] ? this.parseImmediate(operands[0], symbols) : 0x0004;
        return {
          address,
          opcode: INSTRUCTIONS.IRQ.opcode,
          mnemonic: 'IRQ',
          op1: vector,
          format: '#vector',
          cycles: INSTRUCTIONS.IRQ.cycles
        };
      }

      case 'IRET': {
        return {
          address,
          opcode: INSTRUCTIONS.IRET.opcode,
          mnemonic: 'IRET',
          format: '',
          cycles: INSTRUCTIONS.IRET.cycles
        };
      }

      case 'HALT': {
        return {
          address,
          opcode: INSTRUCTIONS.HALT.opcode,
          mnemonic: 'HALT',
          format: '',
          cycles: INSTRUCTIONS.HALT.cycles
        };
      }

      default:
        throw new Error(`Unknown mnemonic: ${mnemonic}`);
    }
  }
}
