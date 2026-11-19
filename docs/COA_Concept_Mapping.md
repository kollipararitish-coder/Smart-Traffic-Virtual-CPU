# Computer Organization and Architecture (COA) Concept Mapping

This document provides a comprehensive mapping between undergraduate Computer Organization and Architecture syllabus concepts and their concrete implementation in the **Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU** project.

---

## 1. Syllabus Concept to Codebase Mapping Table

| COA Syllabus Concept | Architectural Role | Codebase Implementation | Practical Demonstration in Project |
| :--- | :--- | :--- | :--- |
| **CPU Architecture** | Central Processing Unit executing instruction cycle | `backend/src/cpu/CPU.js` | Full 5-stage CPU orchestrating registers, ALU, bus, memory, and I/O. |
| **Register Organization** | Dedicated fast internal storage (PC, IR, ACC, R0–R3, SP) | `backend/src/cpu/Registers.js` | 16-bit register file with live hexadecimal, decimal, and binary visualization in UI. |
| **Status Flags / PSW** | Condition code status storage (Zero, Carry, Negative, Overflow) | `backend/src/cpu/Registers.js`, `ALU.js` | Z, C, N, V flags updated dynamically by arithmetic/comparison instructions. |
| **Arithmetic Logic Unit (ALU)** | Combinational circuit performing computation and comparisons | `backend/src/cpu/ALU.js` | ADD, SUB, MUL, DIV (safe zero check), AND, OR, XOR, NOT, CMP, INC, DEC. |
| **Control Unit (CU)** | Hardwired instruction decoding & control signal generation | `backend/src/cpu/ControlUnit.js` | Generates RegWrite, MemRead, MemWrite, IORead, IOWrite, Branch, and ALUOp signals. |
| **Instruction Set Architecture (ISA)** | Complete set of machine instructions, opcodes, and formats | `backend/src/cpu/InstructionSet.js` | 26 documented instructions spanning Data Transfer, Arithmetic, Logic, Branch, I/O, Control. |
| **Assembler & Machine Translation** | Two-pass symbolic assembly translation into machine opcodes | `backend/src/cpu/Assembler.js` | Resolves labels (`NORTH_PRIORITY:`), symbols (`NORTH_COUNT EQU 0xF000`), and generates instructions. |
| **Memory Organization** | 65,536-slot Unified Address Space (Von Neumann model) | `backend/src/cpu/Memory.js` | Address map partitioning: IVT (0x0000), Program (0x0020), Data (0x2000), Stack (0x8000), I/O (0xF000). |
| **Memory-Mapped I/O** | Peripheral interfacing via memory address bus sharing | `backend/src/cpu/Memory.js` (0xF000–0xF0FF) | CPU reads queue sensors at 0xF000–0xF003 and sets traffic light actuators at 0xF010–0xF013. |
| **Datapath & System Buses** | Interconnect wires transferring data, addresses, and control | `backend/src/cpu/ControlUnit.js` & `DatapathVisualizer.jsx` | Address Bus, Data Bus, and Control Bus highlighted dynamically during stage transitions. |
| **Instruction Execution Cycle** | 5 discrete processing stages of computer architecture | `backend/src/cpu/CPU.js` (`step()`) | Observable Fetch, Decode, Execute, Memory Access, and Write Back stages. |
| **Interrupt System & PIC** | Hardware asynchronous event notification & preemption | `backend/src/cpu/InterruptController.js` | Emergency vehicle raises IRQ line; CPU saves PC & FLAGS to stack, executes ISR, returns via IRET. |
| **Interrupt Vector Table (IVT)** | Fixed address table storing entry addresses of service routines | `backend/src/cpu/Memory.js` (0x0000–0x001F) | Vector 0x0000 (Reset), Vector 0x0004 (Emergency ISR @ 0x0200). |
| **Hardware Call Stack** | LIFO memory structure for return addresses and register context | `backend/src/cpu/CPU.js` (`SP = 0x8FFF`) | SP decrements on IRQ push (FLAGS, PC) and increments on IRET pop. |
| **Master Clock** | Synchronous timing reference governing state transitions | `backend/src/cpu/Registers.js` (`CLOCK`) | Monotonic clock cycle counter; execution delay configurable via clock speed slider. |

---

## 2. Educational Distinctions: Educational Virtual CPU vs Commercial Processors

To ensure academic rigor during viva examinations, understand how this educational CPU differs from commercial general-purpose CPUs:

1. **Instruction Decoding**:
   - Commercial CPUs (e.g. Intel x86 or ARM Cortex) use complex microcode ROMs or heavily pipelined hardwired logic gates etched in silicon.
   - This virtual CPU implements an explicit, transparent JavaScript Control Unit where students can inspect exact micro-signals (`RegWrite`, `MemRead`, `ALUOp`) for every opcode.
2. **Execution Timing & Pipelining**:
   - Commercial CPUs utilize superscalar execution, branch prediction, and multi-stage speculative out-of-order execution.
   - This educational processor executes instructions through a clean, synchronous 5-stage sequential cycle (Fetch -> Decode -> Execute -> Memory -> Writeback), guaranteeing deterministic reproducibility and single-step observability.
3. **Memory and I/O**:
   - Commercial CPUs use MMUs (Memory Management Units), multi-level caches (L1/L2/L3), and virtual memory paging.
   - This educational CPU implements a clean, flat 65,536-slot physical address space with standard Memory-Mapped I/O, matching the classic architectural model taught in computer organization textbooks (such as Patterson & Hennessy / William Stallings).

## Verified execution model and limitations

- This is an instruction-level COA simulator, using five **sequential** stages per instruction. Instructions do not overlap; it has no pipeline registers, forwarding, or hazard unit. The datapath tabs inspect snapshots of the last instruction, not five independent hardware clocks.
- Each executed instruction increments `CLOCK` by 5. `WAIT #N` adds N-1 idle scheduler ticks, each counted as one additional cycle. Interrupt entry adds 4 cycles. The speed control is milliseconds per instruction/idle tick, not milliseconds per stage. Signal dwell times therefore scale with CPU speed and also include instruction overhead.
- Memory contains 65,536 addressable JavaScript slots with 16-bit numeric data or decoded instruction objects. It is not a byte-packed 64 KB RAM or binary machine-code implementation.
- Run and Step share a 20 ms maximum traffic integration timestep. Pause freezes simulation time. During Step, traffic advances by the remaining time to the next CPU instruction/WAIT tick.
- The default emergency ISR uses scratch RAM `0x2000..0x2004` to preserve R0 and the interrupted signal phase. Hardware preserves PC/FLAGS on the stack and suspends the old WAIT; IRET resumes it. Yellow warning and all-red clearance surround emergency priority. Custom ISRs must preserve their own working registers. A second emergency is rejected while one is in service.
- Signal writes reject conflicting non-red approaches. A runtime fault halts the service and forces all-red. This remains an educational simulation, not a validated road controller; its simplified motion and speed-dependent timing are not real-world safety guarantees.
- The default policy selects the largest queue with fixed tie order; it has no aging/fairness guarantee, and low-volume lanes may wait longer. Ordinary lanes cap queued arrivals at 8; emergency insertion is a separate demonstration event. No AI/ML or physical GPS/sensors are used.
- Average wait measures accumulated queue-blocked simulation time of vehicles that have passed the stop line. Vehicles still queued are excluded from that average.
- SQLite logs every executed instruction in Run and Step, records traffic snapshots, and marks emergency completion only on ACK. Reset saves the old session totals first, starts a new session and seeds the original 14 vehicles. Tests use in-memory databases.
- One backend serves one shared simulation. This package is intended for local classroom use. A long-running session accumulates SQLite rows; no retention or multi-user isolation is implemented.
