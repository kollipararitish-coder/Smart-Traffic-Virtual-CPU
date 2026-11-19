/**
 * InstructionSet.js
 * Complete Instruction Set Architecture (ISA) Definition for Educational Virtual CPU
 */

export const INSTRUCTIONS = {
  // --- Data Transfer Instructions ---
  LOAD_MEM: {
    mnemonic: 'LOAD',
    opcode: 0x01,
    format: 'Rd, [addr]',
    category: 'Data Transfer',
    cycles: 5,
    description: 'Load value from memory address [addr] into register Rd',
    behavior: 'Rd <- Memory[addr]'
  },
  LOAD_IMM: {
    mnemonic: 'LOAD',
    opcode: 0x02,
    format: 'Rd, #imm',
    category: 'Data Transfer',
    cycles: 5,
    description: 'Load immediate value #imm into register Rd',
    behavior: 'Rd <- imm'
  },
  LOAD_REG: {
    mnemonic: 'LOAD',
    opcode: 0x03,
    format: 'Rd, Rs',
    category: 'Data Transfer',
    cycles: 5,
    description: 'Load value from source register Rs into register Rd',
    behavior: 'Rd <- Rs'
  },
  STORE: {
    mnemonic: 'STORE',
    opcode: 0x04,
    format: '[addr], Rs',
    category: 'Data Transfer',
    cycles: 5,
    description: 'Store value from register Rs into memory address [addr]',
    behavior: 'Memory[addr] <- Rs'
  },
  MOV: {
    mnemonic: 'MOV',
    opcode: 0x05,
    format: 'Rd, Rs',
    category: 'Data Transfer',
    cycles: 5,
    description: 'Move value from register Rs to register Rd',
    behavior: 'Rd <- Rs'
  },
  MOV_IMM: {
    mnemonic: 'MOV',
    opcode: 0x06,
    format: 'Rd, #imm',
    category: 'Data Transfer',
    cycles: 5,
    description: 'Move immediate value into register Rd',
    behavior: 'Rd <- imm'
  },

  // --- Arithmetic Instructions ---
  ADD: {
    mnemonic: 'ADD',
    opcode: 0x10,
    format: 'Rd, Rs',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Add Rs to Rd and store result in Rd; updates Z, C, N, V flags',
    behavior: 'Rd <- Rd + Rs; update flags'
  },
  ADD_IMM: {
    mnemonic: 'ADD',
    opcode: 0x11,
    format: 'Rd, #imm',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Add immediate value to Rd; updates Z, C, N, V flags',
    behavior: 'Rd <- Rd + imm; update flags'
  },
  SUB: {
    mnemonic: 'SUB',
    opcode: 0x12,
    format: 'Rd, Rs',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Subtract Rs from Rd and store result in Rd; updates Z, C, N, V flags',
    behavior: 'Rd <- Rd - Rs; update flags'
  },
  SUB_IMM: {
    mnemonic: 'SUB',
    opcode: 0x13,
    format: 'Rd, #imm',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Subtract immediate value from Rd; updates Z, C, N, V flags',
    behavior: 'Rd <- Rd - imm; update flags'
  },
  MUL: {
    mnemonic: 'MUL',
    opcode: 0x14,
    format: 'Rd, Rs',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Multiply Rd by Rs and store result in Rd; updates flags',
    behavior: 'Rd <- Rd * Rs; update flags'
  },
  MUL_IMM: {
    mnemonic: 'MUL',
    opcode: 0x15,
    format: 'Rd, #imm',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Multiply Rd by immediate value; updates flags',
    behavior: 'Rd <- Rd * imm; update flags'
  },
  DIV: {
    mnemonic: 'DIV',
    opcode: 0x16,
    format: 'Rd, Rs',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Divide Rd by Rs safely; updates flags',
    behavior: 'Rd <- Rd / Rs; if Rs==0 then Rd <- 0 and V <- 1'
  },
  DIV_IMM: {
    mnemonic: 'DIV',
    opcode: 0x17,
    format: 'Rd, #imm',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Divide Rd by immediate value safely; updates flags',
    behavior: 'Rd <- Rd / imm; if imm==0 then Rd <- 0 and V <- 1'
  },
  INC: {
    mnemonic: 'INC',
    opcode: 0x18,
    format: 'Rd',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Increment Rd by 1; updates Z, C, N, V flags',
    behavior: 'Rd <- Rd + 1; update flags'
  },
  DEC: {
    mnemonic: 'DEC',
    opcode: 0x19,
    format: 'Rd',
    category: 'Arithmetic',
    cycles: 5,
    description: 'Decrement Rd by 1; updates Z, C, N, V flags',
    behavior: 'Rd <- Rd - 1; update flags'
  },

  // --- Logical Instructions ---
  AND: {
    mnemonic: 'AND',
    opcode: 0x20,
    format: 'Rd, Rs',
    category: 'Logical',
    cycles: 5,
    description: 'Bitwise AND of Rd and Rs; updates Z and N flags',
    behavior: 'Rd <- Rd & Rs; update Z, N'
  },
  AND_IMM: {
    mnemonic: 'AND',
    opcode: 0x21,
    format: 'Rd, #imm',
    category: 'Logical',
    cycles: 5,
    description: 'Bitwise AND of Rd and immediate value; updates Z and N flags',
    behavior: 'Rd <- Rd & imm; update Z, N'
  },
  OR: {
    mnemonic: 'OR',
    opcode: 0x22,
    format: 'Rd, Rs',
    category: 'Logical',
    cycles: 5,
    description: 'Bitwise OR of Rd and Rs; updates Z and N flags',
    behavior: 'Rd <- Rd | Rs; update Z, N'
  },
  OR_IMM: {
    mnemonic: 'OR',
    opcode: 0x23,
    format: 'Rd, #imm',
    category: 'Logical',
    cycles: 5,
    description: 'Bitwise OR of Rd and immediate value; updates Z and N flags',
    behavior: 'Rd <- Rd | imm; update Z, N'
  },
  XOR: {
    mnemonic: 'XOR',
    opcode: 0x24,
    format: 'Rd, Rs',
    category: 'Logical',
    cycles: 5,
    description: 'Bitwise XOR of Rd and Rs; updates Z and N flags',
    behavior: 'Rd <- Rd ^ Rs; update Z, N'
  },
  XOR_IMM: {
    mnemonic: 'XOR',
    opcode: 0x25,
    format: 'Rd, #imm',
    category: 'Logical',
    cycles: 5,
    description: 'Bitwise XOR of Rd and immediate value; updates Z and N flags',
    behavior: 'Rd <- Rd ^ imm; update Z, N'
  },
  NOT: {
    mnemonic: 'NOT',
    opcode: 0x26,
    format: 'Rd',
    category: 'Logical',
    cycles: 5,
    description: 'Bitwise NOT of Rd; updates Z and N flags',
    behavior: 'Rd <- ~Rd; update Z, N'
  },

  // --- Comparison Instructions ---
  CMP: {
    mnemonic: 'CMP',
    opcode: 0x30,
    format: 'Rd, Rs',
    category: 'Comparison',
    cycles: 5,
    description: 'Compare Rd with Rs (Rd - Rs) and set flags without altering Rd',
    behavior: 'Evaluate Rd - Rs; update Z, C, N, V'
  },
  CMP_IMM: {
    mnemonic: 'CMP',
    opcode: 0x31,
    format: 'Rd, #imm',
    category: 'Comparison',
    cycles: 5,
    description: 'Compare Rd with immediate value (Rd - imm) and set flags',
    behavior: 'Evaluate Rd - imm; update Z, C, N, V'
  },

  // --- Branch Instructions ---
  JMP: {
    mnemonic: 'JMP',
    opcode: 0x40,
    format: 'addr',
    category: 'Branch',
    cycles: 5,
    description: 'Unconditional jump to target memory address',
    behavior: 'PC <- addr'
  },
  JZ: {
    mnemonic: 'JZ',
    opcode: 0x41,
    format: 'addr',
    category: 'Branch',
    cycles: 5,
    description: 'Jump to address if Zero Flag is set (Z == 1)',
    behavior: 'if (Z == 1) PC <- addr'
  },
  JNZ: {
    mnemonic: 'JNZ',
    opcode: 0x42,
    format: 'addr',
    category: 'Branch',
    cycles: 5,
    description: 'Jump to address if Zero Flag is not set (Z == 0)',
    behavior: 'if (Z == 0) PC <- addr'
  },
  JC: {
    mnemonic: 'JC',
    opcode: 0x43,
    format: 'addr',
    category: 'Branch',
    cycles: 5,
    description: 'Jump to address if Carry Flag is set (C == 1)',
    behavior: 'if (C == 1) PC <- addr'
  },
  JN: {
    mnemonic: 'JN',
    opcode: 0x44,
    format: 'addr',
    category: 'Branch',
    cycles: 5,
    description: 'Jump to address if Negative Flag is set (N == 1)',
    behavior: 'if (N == 1) PC <- addr'
  },
  JGT: {
    mnemonic: 'JGT',
    opcode: 0x45,
    format: 'addr',
    category: 'Branch',
    cycles: 5,
    description: 'Jump if Greater Than (Z == 0 and N == V)',
    behavior: 'if (Z == 0 && N == V) PC <- addr'
  },
  JLT: {
    mnemonic: 'JLT',
    opcode: 0x46,
    format: 'addr',
    category: 'Branch',
    cycles: 5,
    description: 'Jump if Less Than (N != V)',
    behavior: 'if (N != V) PC <- addr'
  },

  // --- I/O Instructions ---
  IN: {
    mnemonic: 'IN',
    opcode: 0x50,
    format: 'Rd, [port]',
    category: 'I/O',
    cycles: 5,
    description: 'Read data from I/O port [port] into register Rd',
    behavior: 'Rd <- I/O[port]'
  },
  OUT: {
    mnemonic: 'OUT',
    opcode: 0x51,
    format: '[port], Rs',
    category: 'I/O',
    cycles: 5,
    description: 'Write value of register Rs to I/O port [port]',
    behavior: 'I/O[port] <- Rs'
  },
  OUT_IMM: {
    mnemonic: 'OUT',
    opcode: 0x52,
    format: '[port], #imm',
    category: 'I/O',
    cycles: 5,
    description: 'Write immediate value to I/O port [port]',
    behavior: 'I/O[port] <- imm'
  },

  // --- Control Instructions ---
  WAIT: {
    mnemonic: 'WAIT',
    opcode: 0x60,
    format: '#cycles',
    category: 'Control',
    cycles: 5,
    description: 'Wait / delay CPU execution for the specified number of ticks/cycles',
    behavior: '5 stage cycles plus N-1 idle ticks'
  },
  NOP: {
    mnemonic: 'NOP',
    opcode: 0x61,
    format: '',
    category: 'Control',
    cycles: 5,
    description: 'No operation; advances PC and consumes 5 stage cycles',
    behavior: 'No state change; PC <- PC + 1'
  },
  IRQ: {
    mnemonic: 'IRQ',
    opcode: 0x62,
    format: '#vector',
    category: 'Control',
    cycles: 5,
    description: 'Generate software interrupt request for the specified vector',
    behavior: 'Push FLAGS, PC to stack; PC <- VectorTable[vector]'
  },
  IRET: {
    mnemonic: 'IRET',
    opcode: 0x63,
    format: '',
    category: 'Control',
    cycles: 5,
    description: 'Return from Interrupt Service Routine; restores PC and FLAGS from stack',
    behavior: 'FLAGS <- Pop(); PC <- Pop()'
  },
  HALT: {
    mnemonic: 'HALT',
    opcode: 0x6F,
    format: '',
    category: 'Control',
    cycles: 5,
    description: 'Halt CPU execution permanently until reset',
    behavior: 'CPU enters HALTED state'
  }
};

// Build fast opcode lookup maps
export const OPCODE_MAP = {};
for (const [key, instr] of Object.entries(INSTRUCTIONS)) {
  OPCODE_MAP[instr.opcode] = { ...instr, key };
}

export const MNEMONIC_MAP = {};
for (const [key, instr] of Object.entries(INSTRUCTIONS)) {
  if (!MNEMONIC_MAP[instr.mnemonic]) {
    MNEMONIC_MAP[instr.mnemonic] = [];
  }
  MNEMONIC_MAP[instr.mnemonic].push({ ...instr, key });
}
