# System Architecture & Hardware Subsystem Design

## 1. High-Level Architectural Overview

The **Smart Traffic Signal Controller** is structured according to classical Computer Organization and Architecture (COA) principles. The system consists of five distinct subsystems:

```
+-------------------------------------------------------------------------------+
|                             VIRTUAL CPU CORE                                  |
|                                                                               |
|   +---------------+      +-------------------+      +---------------------+   |
|   | Register File | <--> |  Arithmetic Logic | <--> |    Control Unit     |   |
|   |  (PC, IR, ACC,|      |    Unit (ALU)     |      |  (5-Stage Decoder & |   |
|   |   R0-R3, SP)  |      |   (16-bit Math)   |      |   Micro-Signals)    |   |
|   +---------------+      +-------------------+      +---------------------+   |
+-----------^------------------------^---------------------------^--------------+
            |                        |                           |
            |                        |                           |
+-----------v------------------------v---------------------------v--------------+
|                         SYSTEM BUS INFRASTRUCTURE                             |
|   - 16-bit Address Bus                                                        |
|   - 16-bit Bidirectional Data Bus                                             |
|   - Multi-line Control Bus (RegWrite, MemRead, MemWrite, IORead, IOWrite, etc)|
+-----------^----------------------------------------------------^--------------+
            |                                                    |
            |                                                    |
+-----------v------------------------+          +----------------v--------------+
|        UNIFIED MEMORY SYSTEM       |          |     MEMORY-MAPPED I/O         |
|   0x0000 - 0x001F: Vector Table    |          |   0xF000: North Sensor        |
|   0x0020 - 0x1FFF: Code Memory     |          |   0xF001: South Sensor        |
|   0x2000 - 0x7FFF: Data Memory     |          |   0xF002: East Sensor         |
|   0x8000 - 0x8FFF: Hardware Stack  |          |   0xF003: West Sensor         |
+------------------------------------+          |   0xF010: North Traffic Light |
                                                |   0xF011: South Traffic Light |
                                                |   0xF012: East Traffic Light  |
                                                |   0xF013: West Traffic Light  |
                                                |   0xF020: Emergency Status    |
                                                |   0xF021: Emergency Ack       |
                                                +-------------------------------+
```

---

## 2. CPU Subsystems

### A. Register Organization
The CPU provides 8 primary 16-bit registers:
1. **PC (Program Counter)**: Contains the memory address of the next instruction to fetch. Initialized to `0x0020`. Incremented during the FETCH stage unless altered by a branch (`JMP`, `JZ`, `JNZ`, `JGT`, `JLT`) or interrupt entry/return (`IRQ`, `IRET`).
2. **IR (Instruction Register)**: Latches the fetched instruction during the FETCH stage. Directly feeds the Control Unit decoder.
3. **ACC (Accumulator)**: Primary working register for arithmetic and logic transformations.
4. **R0, R1, R2, R3**: General-purpose registers utilized by assembly programs to store sensor readings, compute thresholds, and hold signal codes.
5. **SP (Stack Pointer)**: Hardware call stack pointer initialized to `0x8FFF`. Decrements on push operations (saving PC and FLAGS during interrupt handling) and increments on pop operations (`IRET`).
6. **FLAGS Register (PSW)**: 4 status bits:
   - **Z (Zero)**: Set to 1 if the operation result is zero.
   - **C (Carry)**: Set to 1 if an unsigned carry or borrow occurred.
   - **N (Negative)**: Set to 1 if the most significant bit (bit 15) is set.
   - **V (Overflow)**: Set to 1 if signed arithmetic overflow occurred.
7. **CLOCK**: JavaScript safe-integer counter tracking elapsed machine clock cycles.

---

### B. Arithmetic Logic Unit (ALU)
The ALU executes combinational arithmetic and bitwise logic operations:
- Arithmetic: `ADD`, `SUB`, `MUL`, `DIV`, `INC`, `DEC`
- Logic: `AND`, `OR`, `XOR`, `NOT`
- Comparison: `CMP` (performs subtraction `Rd - Rs` without altering destination register, updating status flags)
- Division by Zero Safety: Safe check ensures division by zero returns 0 and sets the Overflow flag `V` rather than crashing the virtual hardware.

---

### C. Control Unit & Instruction Execution Cycle
The Control Unit sequences instructions through a classical five-stage sequential instruction cycle:
1. **FETCH**:
   - `AddressBus <- PC`
   - Memory access asserts instruction onto `DataBus`
   - `IR <- DataBus`
   - `PC <- PC + 1`
2. **DECODE**:
   - Opcode decoded from `IR`
   - Control Unit asserts signals: `RegWrite`, `ALUSrc`, `MemToReg`, `ALUOp`, `MemRead`, `MemWrite`, `IORead`, `IOWrite`, `Branch`
   - Source register values read onto internal bus
3. **EXECUTE**:
   - ALU performs arithmetic/logic operation OR
   - Branch condition evaluated (`Z == 1`, `N == V`, etc.)
4. **MEMORY ACCESS**:
   - If `MemRead`: Data read from `Memory[addr]`
   - If `MemWrite`: Register value written to `Memory[addr]`
   - If `IORead`: Peripheral sensor data read from `IO[port]`
   - If `IOWrite`: Signal actuator state written to `IO[port]`
5. **WRITE BACK**:
   - If `RegWrite`: Result committed to destination register `Rd`
   - Clock cycle completed and trace logged.

---

### D. Interrupt Subsystem
Hardware interrupt line `IRQ` connects peripheral emergency sensors to the CPU:
- When an ambulance/fire truck arrives, an interrupt request with vector `0x0004` is asserted.
- At the end of the instruction cycle, the CPU tests the interrupt line.
- If enabled (`IE == 1`):
  1. Current `PC` and `FLAGS` are pushed onto the stack via `SP`.
  2. The target ISR address (`0x0200`) is fetched from the Interrupt Vector Table (`Memory[0x0004]`).
  3. `PC` is loaded with `0x0200`.
  4. The ISR preserves R0 and signal phase, warns with yellow, clears to all-red, grants emergency green, clears again, restores the interrupted signals/R0, writes ACK and executes IRET.
  5. `IRET` pops `FLAGS` and `PC` from the stack, smoothly returning CPU execution to the exact instruction where it was interrupted.

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
