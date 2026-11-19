# Computer Organization and Architecture (COA) Viva Questions & Answers

This document provides model questions and detailed technical answers to help students excel during the project viva examination and evaluation.

---

### Q1: What is the core objective of this project?
**Answer**:
The core objective is to demonstrate Computer Organization and Architecture (COA) principles through an actual, working instruction-level virtual CPU implemented from scratch. The 4-way traffic intersection is the practical cyber-physical application controlled via memory-mapped I/O instructions executed by this virtual CPU. It is NOT merely a frontend animation or an ordinary web app—the traffic signals change strictly because the CPU fetches, decodes, and executes assembly instructions.

---

### Q2: Why did you implement a custom educational virtual CPU instead of an Intel 8086 emulator?
**Answer**:
Commercial processors like the 8086 or ARM have decades of legacy architectural complexity (segmentation registers, complex multi-byte variable-length encodings, asynchronous bus interfaces) that obscure core educational concepts. Our custom 16-bit virtual CPU implements a clean, transparent, orthogonal Instruction Set Architecture (ISA) where students and examiners can directly observe the five-stage sequential instruction cycle, micro-control signals (`RegWrite`, `ALUOp`, `MemRead`, `IORead`), and bus transfers in real time.

---

### Q3: What registers are present in the CPU and what are their functions?
**Answer**:
- **PC (Program Counter)**: Holds the 16-bit memory address of the next instruction to fetch.
- **IR (Instruction Register)**: Latches the fetched instruction object/opcode for decoding by the Control Unit.
- **ACC (Accumulator)**: Primary working register for arithmetic and logic operations.
- **R0, R1, R2, R3**: General-purpose registers. In the traffic program, they hold vehicle counts read from North, South, East, and West sensor ports.
- **SP (Stack Pointer)**: Points to the top of the stack (0x8FFF). Used during interrupts to push/pop PC and FLAGS.
- **FLAGS (Status Register / PSW)**: Contains 4 condition flags: Zero (Z), Carry (C), Negative (N), and Overflow (V).
- **CLOCK**: Monotonic clock counter tracking the total clock cycles executed.

---

### Q4: Explain the 5 stages of the CPU instruction execution cycle.
**Answer**:
1. **FETCH**: The CPU places the value of `PC` onto the Address Bus, reads the instruction from Memory, latches it into `IR`, and increments `PC`.
2. **DECODE**: The Control Unit decodes the opcode in `IR`, evaluates micro-operations, reads operand registers, and asserts control signals.
3. **EXECUTE**: The ALU executes arithmetic, logic, or comparison (`CMP`) operations, or calculates the effective branch target address. Status flags (Z, C, N, V) are updated.
4. **MEMORY ACCESS**: Data memory read (`MemRead`), data memory write (`MemWrite`), sensor port read (`IORead`), or actuator port write (`IOWrite`) takes place across the Data Bus.
5. **WRITE BACK**: If `RegWrite` is asserted, the result is committed into the destination register (`Rd`).

---

### Q5: How is Memory-Mapped I/O implemented in your architecture?
**Answer**:
In memory-mapped I/O, peripheral devices are assigned addresses in the memory address space rather than having isolated I/O instructions and pins.
- Addresses `0xF000` to `0xF003` are mapped to traffic queue sensors (North, South, East, West). When the CPU executes `IN R0, [0xF000]`, the bus controller accesses the sensor interface and loads the North vehicle count into register `R0`.
- Addresses `0xF010` to `0xF013` are mapped to signal actuators. When the CPU executes `OUT [0xF010], #2`, the bus controller transmits the code `2` (Green) to the North traffic light.
- Address `0xF020` reads emergency status, and `0xF021` acknowledges emergency clearance.

---

### Q6: How does the CPU handle emergency vehicles using the interrupt mechanism?
**Answer**:
1. When an emergency vehicle arrives, the simulation asserts an interrupt request on the `IRQ` line for Vector `0x0004`.
2. At the instruction boundary, the CPU detects `hasPending()`.
3. The CPU saves context by pushing `PC` and `FLAGS` onto the hardware stack via `SP` (`SP <- SP - 1`).
4. The CPU reads the Interrupt Vector Table (IVT) at address `0x0004`, obtaining the ISR address `0x0200`, and sets `PC <- 0x0200`.
5. The CPU executes the Interrupt Service Routine (ISR): reads `0xF020` to detect the emergency lane, immediately turns all other lights RED, turns the emergency lane GREEN, waits for vehicle clearance, writes `1` to `0xF021` (Ack), and executes `IRET`.
6. `IRET` pops `FLAGS` and `PC` from the stack, smoothly returning CPU execution to the interrupted instruction.

---

### Q7: How does the ALU safely handle division by zero?
**Answer**:
In `ALU.div(a, b)`, if divisor `b == 0`, the ALU intercepts the condition, returns `result = 0`, sets the Overflow flag `V = 1`, and logs a `DIVISION_BY_ZERO` flag. This prevents runtime crashes while accurately modeling hardware overflow exception behavior.

---

### Q8: How does the traffic assembly program dynamically prioritize traffic?
**Answer**:
The assembly program (`TrafficProgram.js`) reads all four queue sensors into registers (`R0` for North, `R1` for South, `R2` for East, `R3` for West). It uses `CMP` and conditional jump instructions (`JGT`) to perform pairwise comparisons, determining the lane with the highest queue length. It then selects that direction's green phase, maintains safe yellow and all-red clearance intervals using `WAIT` instructions, and loops continuously.

---

### Q9: How do you guarantee that UI values are not fabricated?
**Answer**:
The backend holds the single source of truth (`CPU.js`, `Registers.js`, `Memory.js`, and `TrafficController.js`). Every register value, flag bit, stage indicator, and traffic light color rendered in the frontend is received directly over WebSocket (`Socket.IO`) or REST API from the actual running JavaScript CPU instance. When the user clicks "Single Step", exactly one 5-stage instruction cycle executes in the backend.

---

### Q10: How is persistent analytics stored?
**Answer**:
We use SQLite (`node:sqlite` Native DatabaseSync). Every simulation session, CPU execution trace log (cycle, PC, mnemonic, opcode, ALU result, flags), traffic density snapshot, and emergency interrupt event is stored in relational SQLite tables (`sessions`, `cpu_logs`, `traffic_stats`, `emergency_events`). Real analytics charts are rendered dynamically from this persisted data.

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
