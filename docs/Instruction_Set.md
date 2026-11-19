# Instruction Set Reference

28 mnemonics, 40 encoding variants. Instruction objects occupy one addressable slot. Numeric data registers and addresses are 16-bit.

| Mnemonic | Opcode | Operands | Base stage cycles | Behavior |
|---|---|---|---|---|
| LOAD | 0x01 | Rd, [addr] | 5 | Rd <- Memory[addr] |
| LOAD | 0x02 | Rd, #imm | 5 | Rd <- imm |
| LOAD | 0x03 | Rd, Rs | 5 | Rd <- Rs |
| STORE | 0x04 | [addr], Rs | 5 | Memory[addr] <- Rs |
| MOV | 0x05 | Rd, Rs | 5 | Rd <- Rs |
| MOV | 0x06 | Rd, #imm | 5 | Rd <- imm |
| ADD | 0x10 | Rd, Rs | 5 | Rd <- Rd + Rs; update flags |
| ADD | 0x11 | Rd, #imm | 5 | Rd <- Rd + imm; update flags |
| SUB | 0x12 | Rd, Rs | 5 | Rd <- Rd - Rs; update flags |
| SUB | 0x13 | Rd, #imm | 5 | Rd <- Rd - imm; update flags |
| MUL | 0x14 | Rd, Rs | 5 | Rd <- Rd * Rs; update flags |
| MUL | 0x15 | Rd, #imm | 5 | Rd <- Rd * imm; update flags |
| DIV | 0x16 | Rd, Rs | 5 | Rd <- Rd / Rs; if Rs==0 then Rd <- 0 and V <- 1 |
| DIV | 0x17 | Rd, #imm | 5 | Rd <- Rd / imm; if imm==0 then Rd <- 0 and V <- 1 |
| INC | 0x18 | Rd | 5 | Rd <- Rd + 1; update flags |
| DEC | 0x19 | Rd | 5 | Rd <- Rd - 1; update flags |
| AND | 0x20 | Rd, Rs | 5 | Rd <- Rd & Rs; update Z, N |
| AND | 0x21 | Rd, #imm | 5 | Rd <- Rd & imm; update Z, N |
| OR | 0x22 | Rd, Rs | 5 | Rd <- Rd OR Rs; update Z, N |
| OR | 0x23 | Rd, #imm | 5 | Rd <- Rd OR imm; update Z, N |
| XOR | 0x24 | Rd, Rs | 5 | Rd <- Rd ^ Rs; update Z, N |
| XOR | 0x25 | Rd, #imm | 5 | Rd <- Rd ^ imm; update Z, N |
| NOT | 0x26 | Rd | 5 | Rd <- ~Rd; update Z, N |
| CMP | 0x30 | Rd, Rs | 5 | Evaluate Rd - Rs; update Z, C, N, V |
| CMP | 0x31 | Rd, #imm | 5 | Evaluate Rd - imm; update Z, C, N, V |
| JMP | 0x40 | addr | 5 | PC <- addr |
| JZ | 0x41 | addr | 5 | if (Z == 1) PC <- addr |
| JNZ | 0x42 | addr | 5 | if (Z == 0) PC <- addr |
| JC | 0x43 | addr | 5 | if (C == 1) PC <- addr |
| JN | 0x44 | addr | 5 | if (N == 1) PC <- addr |
| JGT | 0x45 | addr | 5 | if (Z == 0 && N == V) PC <- addr |
| JLT | 0x46 | addr | 5 | if (N != V) PC <- addr |
| IN | 0x50 | Rd, [port] | 5 | Rd <- I/O[port] |
| OUT | 0x51 | [port], Rs | 5 | I/O[port] <- Rs |
| OUT | 0x52 | [port], #imm | 5 | I/O[port] <- imm |
| WAIT | 0x60 | #cycles | 5 | 5 stage cycles plus N-1 idle ticks |
| NOP | 0x61 |  | 5 | No state change; PC <- PC + 1 |
| IRQ | 0x62 | #vector | 5 | Push FLAGS, PC to stack; PC <- VectorTable[vector] |
| IRET | 0x63 |  | 5 | FLAGS <- Pop(); PC <- Pop() |
| HALT | 0x6f |  | 5 | CPU enters HALTED state |

`WAIT #N` executes five stages and then N-1 idle ticks; interrupt entry adds four cycles. These are educational accounting units. `JGT/JLT` use signed conditions (N/V); `JC` uses carry/borrow. DIV is unsigned with zero-divisor result 0 and V=1. MUL C indicates unsigned carry and V indicates signed overflow. Logical operations clear C and V.

Registers: ACC, R0–R3, PC and SP contain 16-bit values; IR holds a decoded object; FLAGS contains Z/C/N/V; IE enables interrupts; CLOCK is a JavaScript safe-integer counter; STAGE is a string. Code is assembled with labels, EQU and ORG. First instruction is the entry point. Immediate literals use #; memory operands use brackets. WAIT must be positive. IN/OUT addresses must be 0xF000..0xF0FF.
