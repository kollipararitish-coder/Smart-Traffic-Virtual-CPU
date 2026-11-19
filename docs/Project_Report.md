# ACADEMIC PROJECT REPORT

# Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU
## A Complete Computer Organization and Architecture (COA) Engineering Project

---

## 1. COVER PAGE

- **Project Title**: Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU
- **Course**: Computer Organization and Architecture (COA)
- **Degree Program**: Bachelor of Technology / Bachelor of Engineering in Computer Science & Engineering
- **Academic Year**: 2026–2027
- **Author/Lead Engineer**: Senior Computer Architecture & Full-Stack Engineering Team
- **Technology Stack**: React 18, Vite, Tailwind CSS, Recharts, Lucide React, Node.js, Express.js, Socket.IO, SQLite (`node:sqlite`), Vitest, Supertest
- **Operating Environment**: Microsoft Windows 10 / 11 (64-bit)

---

## 2. ABSTRACT

Traditional Computer Organization and Architecture (COA) pedagogy suffers from an abstraction gap: students study registers, instruction formats, Arithmetic Logic Units (ALUs), system buses, and interrupt mechanisms theoretically, but lack an observable, cyber-physical platform to witness how machine instructions manipulate real-world actuators. This project designs and implements a complete, working, full-stack educational system: **Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU**. 

The system features a custom 16-bit virtual Central Processing Unit (CPU) implemented in pure JavaScript, executing an orthogonal 28-mnemonic Instruction Set Architecture (ISA). The CPU features eight functional registers (`PC`, `IR`, `ACC`, `R0–R3`, `SP`), a full Arithmetic Logic Unit supporting condition code flags (`Z`, `C`, `N`, `V`), a hardwired micro-signal Control Unit, a unified 65,536-slot memory with Memory-Mapped I/O, and an asynchronous Interrupt Controller with a hardware call stack. A 4-way traffic intersection simulation is coupled directly to the CPU's memory-mapped I/O address space (sensors at `0xF000–0xF003` and signal actuators at `0xF010–0xF013`). A dynamic traffic management assembly program continuously evaluates lane queue densities and controls signal transitions, while emergency vehicle injection triggers hardware interrupt requests (`IRQ` Vector `0x0004`) serviced by an Interrupt Service Routine (`ISR`). The frontend dashboard provides real-time visualization of the register file, ALU, five-stage sequential instruction cycle datapath, assembly source code, execution trace, and SQLite-backed analytics. The project is verified via a 77-case automated test suite; see Testing_Report.md for scope and limitations.

---

## 3. INTRODUCTION

Microprocessor architecture and assembly language programming form the cornerstone of computer engineering. However, commercial microprocessors (such as modern x86-64 or ARMv8/v9 architectures) feature billions of transistors, multi-level out-of-order execution pipelines, translation lookaside buffers, and proprietary microcode engines that make them impenetrable to students beginning their architectural studies.

This project implements an open, instruction-level virtual CPU designed specifically for undergraduate pedagogy. Rather than presenting abstract register numbers without a functional purpose, this system binds the virtual CPU directly to a four-way traffic signal intersection. Traffic lights do not cycle based on hardcoded web animations or high-level scripting loops; instead, they transition strictly because the virtual CPU fetches an `IN` instruction from instruction memory, reads simulated vehicle queue sensors into general-purpose registers, executes a `CMP` comparison in the ALU, branches conditionally using `JGT`, and outputs signal codes (`RED=0`, `YELLOW=1`, `GREEN=2`) via `OUT` instructions to memory-mapped actuators.

---

## 4. PROBLEM STATEMENT

In conventional computer architecture laboratory curricula:
1. Students interact with command-line emulators (such as DOSBox 8086) that emphasize legacy 16-bit segmented addressing bugs rather than modern clean RISC datapath concepts.
2. Web-based traffic light demonstrations are purely cosmetic animations governed by `setTimeout()` loops without any underlying CPU architecture, buses, or registers.
3. Students cannot observe internal data movement along Address, Data, and Control buses during the five fundamental stages of instruction execution: Fetch, Decode, Execute, Memory Access, and Write Back.
4. Interrupt handling is presented abstractly without demonstrating context saving on a hardware call stack and preemption of running assembly routines.

There is a compelling need for a unified, full-stack educational simulator combining an authentic virtual CPU engine, physical traffic actuators, transparent bus datapath visualizers, and persistent database analytics.

---

## 5. OBJECTIVES

1. **Design a 16-Bit Educational Virtual CPU**: Implement functional registers (`PC`, `IR`, `ACC`, `R0–R3`, `SP`), a condition code status register (`FLAGS: Z, C, N, V`), and a master clock cycle counter.
2. **Implement an Arithmetic Logic Unit (ALU)**: Support addition, subtraction, multiplication, safe division by zero, bitwise operations (`AND`, `OR`, `XOR`, `NOT`), comparison (`CMP`), and increment/decrement.
3. **Construct a 28-Mnemonic ISA & Two-Pass Assembler**: Support Data Transfer, Arithmetic, Logic, Comparison, Branching, I/O, and Control instructions with symbolic labels.
4. **Model a Five-Stage Sequential Datapath**: Make Fetch, Decode, Execute, Memory Access, and Write Back stages observable with real-time bus activation indicators.
5. **Implement Memory-Mapped I/O & Interrupt Subsystem**: Interface physical traffic sensors (`0xF000–0xF003`) and signals (`0xF010–0xF013`) to memory addresses and handle emergency preemption via hardware `IRQ` and an Interrupt Service Routine (`ISR`).
6. **Build an Engineering Dashboard**: Provide real-time UI views for Overview, Architecture, Instruction Execution, Datapath, Intersection Simulation, Memory Dump, and SQLite Analytics.
7. **Ensure Automated Quality Assurance**: Achieve 100% automated test coverage across CPU, memory, interrupts, traffic integration, and REST APIs.

---

## 6. EXISTING SYSTEM

Existing educational simulation tools fall into two unsatisfactory categories:
1. **Generic Logic Gate Simulators (e.g., Logisim, CPU Sim)**: Excellent for gate-level wiring, but clumsy for demonstrating high-level cyber-physical systems like traffic control. They lack web dashboard integration, real-time analytics, and realistic physical simulations.
2. **Commercial Chip Emulators (e.g., EMU8086, MARS MIPS)**: Limited to static text console I/O (`INT 21h` or `syscall`). Students write assembly to print strings, but never see assembly instructions actuate physical traffic lights or respond to asynchronous emergency vehicle interrupts.

---

## 7. PROPOSED SYSTEM

The proposed system bridges this divide by delivering an integrated hardware-software architecture:
- **Backend Virtual CPU**: A deterministic JavaScript engine with strict separation of concerns (`CPU.js`, `Registers.js`, `ALU.js`, `ControlUnit.js`, `Memory.js`, `InterruptController.js`, `Assembler.js`).
- **Cyber-Physical Interfacing**: A bidirectional Memory-Mapped I/O subsystem that connects the CPU to a 4-way intersection simulation.
- **Dynamic Assembly Program**: An intelligent traffic control assembly program that polls queues, calculates priorities, and enforces safety clearance intervals.
- **Asynchronous Interrupt Controller**: Real-time hardware interrupt preemption with stack pushing (`PC`, `FLAGS`), vector table resolution, and `IRET` restoration.
- **Zero-Invention UI**: All dashboard values come directly from backend CPU state; no fabricated animations.

---

## 8. SYSTEM REQUIREMENTS

### Hardware Requirements
- **Processor**: Intel Core i3 / AMD Ryzen 3 or higher (x86-64)
- **RAM**: Minimum 4 GB RAM (8 GB recommended)
- **Storage**: 250 MB free disk space
- **Graphics / Display**: 1366x768 resolution minimum (1920x1080 recommended); no dedicated GPU required

### Software Requirements
- **Operating System**: Microsoft Windows 10 or Windows 11 (64-bit)
- **Runtime Environment**: Node.js 24 or higher (tested with 24.22.1 on Linux)
- **Package Manager**: npm v9.0.0 or higher
- **Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave (supporting HTML5 Canvas & WebSockets)

---

## 9. COA CONCEPTS USED

1. **Von Neumann Architecture**: Unified 65,536-slot memory space housing instructions, data, stack, and memory-mapped peripheral registers.
2. **Register Organization**: Special-purpose (`PC`, `IR`, `SP`, `FLAGS`) and general-purpose (`R0–R3`, `ACC`) storage elements.
3. **ALU Design & Condition Codes**: Combinational computation updating Zero, Carry, Negative, and Overflow flags.
4. **Instruction Fetch-Decode-Execute Cycle**: 5 discrete machine cycles orchestrated by a micro-signal Control Unit.
5. **Instruction Set Architecture (ISA)**: Fixed opcode mapping, operand addressing modes (Immediate, Register, Direct Memory, I/O Port).
6. **Symbolic Two-Pass Assembly**: Label resolution, forward references, and machine code translation.
7. **Buses (Address, Data, Control)**: Tri-state system bus representation transferring 16-bit addresses and data words.
8. **Memory-Mapped I/O**: Direct bus interfacing between CPU load/store operations and peripheral sensor/actuator hardware.
9. **Interrupt Handling & Priority Resolution**: Asynchronous IRQ assertion, Vector Table lookup, stack frame creation, and ISR execution.
10. **Hardware Call Stack**: Last-In-First-Out memory structure supporting return addresses and architectural status restoration.

---

## 10. SYSTEM ARCHITECTURE

The overall system architecture adheres to a clean layered design:

```
[ Frontend Dashboard (React 18 + Vite + Tailwind CSS + Recharts) ]
                            |  ^
                 REST APIs  |  |  Socket.IO WebSockets
                            v  |
[ Express.js Backend Server (HTTP :5000 / WebSocket Broadcast) ]
                            |
[ Master Simulation Service (SimulationService.js) ]
         |                         |                      |
         v                         v                      v
[ Virtual CPU Core ]      [ Traffic Controller ]   [ SQLite Database ]
  - Registers (16-bit)      - 4-Way Intersection     - sessions
  - ALU & Condition Flags   - Queue Physics          - cpu_logs
  - 5-Stage Control Unit    - Departure Logic        - traffic_stats
  - 65,536-slot RAM & Memory I/O   - Sensor Emulation       - emergency_events
  - Interrupt Controller    - Actuator Listeners     - settings
```

---

## 11. CPU ARCHITECTURE

The Virtual CPU is a 16-bit accumulator-augmented multi-register processor:
- Word Size: 16 bits (values 0x0000 to 0xFFFF).
- Addressing Range: 65,536 addressable 16-bit memory words.
- Internal Bus: 16-bit bidirectional internal data bus connecting the Register File, ALU inputs/outputs, and Memory interface.

---

## 12. REGISTER ORGANIZATION

| Register | Width | Architectural Purpose | Reset Value |
| :--- | :--- | :--- | :--- |
| **PC** | 16-bit | Program Counter; holds address of next instruction | `0x0020` |
| **IR** | Object | Instruction Register; latches currently executing instruction | `null` |
| **ACC** | 16-bit | Accumulator; primary computational working register | `0x0000` |
| **R0** | 16-bit | General Purpose 0 (Mapped to North Queue Sensor) | `0x0000` |
| **R1** | 16-bit | General Purpose 1 (Mapped to South Queue Sensor) | `0x0000` |
| **R2** | 16-bit | General Purpose 2 (Mapped to East Queue Sensor) | `0x0000` |
| **R3** | 16-bit | General Purpose 3 (Mapped to West Queue Sensor) | `0x0000` |
| **SP** | 16-bit | Stack Pointer; points to top of stack in RAM | `0x8FFF` |
| **FLAGS** | 4-bit | Condition Code Register (`Z`, `C`, `N`, `V`) | `0000` |
| **CLOCK** | JS safe integer | Total executed clock cycles | `0` |

---

## 13. ALU DESIGN

The Arithmetic Logic Unit (`ALU.js`) is implemented as a pure functional module with 16-bit signed and unsigned arithmetic capabilities:
- **ADD / SUB**: Computes sums and differences, detecting unsigned carry (`C`) and signed overflow (`V`) using sign-bit comparisons.
- **MUL**: Computes products, setting carry and overflow if the result exceeds 16 bits (65,535).
- **DIV**: Computes integer quotients. Safely intercepts divisor `0`, returning `0` and asserting `V=1` with an error indicator.
- **Bitwise Logic**: `AND`, `OR`, `XOR`, `NOT` with Zero (`Z`) and Negative (`N`) flag updates.
- **CMP**: Evaluates `Rd - Rs` without altering `Rd`, updating flags for subsequent conditional branches.
- **INC / DEC**: Single-operand increment and decrement operations.

---

## 14. INSTRUCTION SET

The processor executes 26 instructions across six categories:
1. **Data Transfer**: `LOAD Rd, [addr]`, `LOAD Rd, #imm`, `LOAD Rd, Rs`, `STORE [addr], Rs`, `MOV Rd, Rs`, `MOV Rd, #imm`.
2. **Arithmetic**: `ADD`, `SUB`, `MUL`, `DIV`, `INC`, `DEC`.
3. **Logical**: `AND`, `OR`, `XOR`, `NOT`.
4. **Comparison**: `CMP Rd, Rs`, `CMP Rd, #imm`.
5. **Branching**: `JMP`, `JZ`, `JNZ`, `JC`, `JN`, `JGT`, `JLT`.
6. **I/O & Control**: `IN Rd, [port]`, `OUT [port], Rs`, `OUT [port], #imm`, `WAIT #cycles`, `NOP`, `IRQ #vector`, `IRET`, `HALT`.

---

## 15. MEMORY ORGANIZATION

The 65,536-slot memory map is partitioned into distinct functional regions:
- `0x0000 – 0x001F`: **Interrupt Vector Table (IVT)**
  - `0x0000`: Reset Vector (default: `0x0020`)
  - `0x0004`: Emergency Interrupt Vector (default: `0x0200`)
  - `0x0008`: System Timer Vector (default: `0x0300`)
- `0x0020 – 0x1FFF`: **Instruction Code Memory** (User and system programs)
- `0x2000 – 0x7FFF`: **Data Memory** (Static data, buffers, variables)
- `0x8000 – 0x8FFF`: **Hardware Stack** (`SP` initialized to `0x8FFF`)
- `0xF000 – 0xF0FF`: **Memory-Mapped I/O Registers**:
  - `0xF000`: North Vehicle Count Sensor
  - `0xF001`: South Vehicle Count Sensor
  - `0xF002`: East Vehicle Count Sensor
  - `0xF003`: West Vehicle Count Sensor
  - `0xF010`: North Signal Light Actuator (`0=Red`, `1=Yellow`, `2=Green`)
  - `0xF011`: South Signal Light Actuator
  - `0xF012`: East Signal Light Actuator
  - `0xF013`: West Signal Light Actuator
  - `0xF020`: Emergency Status Direction (`1=N`, `2=S`, `3=E`, `4=W`)
  - `0xF021`: Emergency Acknowledge / Clear (`1` to clear)
  - `0xF030`: System Tick / Timer Reference

---

## 16. DATAPATH

The datapath interconnects the Register File, ALU, Control Unit, Memory, and I/O interface using three primary system buses:
- **Address Bus (16-bit)**: Unidirectional bus driven by `PC` during Fetch, or by operand registers/immediates during Memory Access.
- **Data Bus (16-bit)**: Bidirectional bus transferring instructions from Memory to `IR`, data between Memory and registers, and sensor/actuator values to/from I/O ports.
- **Control Bus**: Multi-conductor line transmitting micro-signals (`RegWrite`, `MemRead`, `MemWrite`, `IORead`, `IOWrite`, `Branch`, `ALUOp`).

The frontend `DatapathVisualizer` renders active components and pulsing bus lines corresponding to the executing instruction.

---

## 17. INSTRUCTION EXECUTION CYCLE

Each instruction progresses sequentially through five observable stages:
1. **FETCH**:
   - `AddressBus <- PC`
   - Memory yields instruction word onto DataBus
   - `IR <- DataBus`
   - `PC <- PC + 1`
2. **DECODE**:
   - Control Unit extracts opcode from `IR`
   - Micro-control signals asserted; register operands loaded
3. **EXECUTE**:
   - ALU computes arithmetic/logic result OR evaluates branch condition
   - Condition flags (`Z`, `C`, `N`, `V`) latched
4. **MEMORY ACCESS**:
   - If memory reference: Data Bus transfers word to/from Data RAM
   - If I/O reference: Peripheral sensor read or actuator write performed
5. **WRITE BACK**:
   - If `RegWrite`: Result written into destination register `Rd`
   - Clock counter updated and cycle trace logged to history

---

## 18. INTERRUPT HANDLING

The interrupt mechanism provides prioritized preemption:
1. **Assertion**: An emergency vehicle arrival triggers an `IRQ` on Vector `0x0004`.
2. **Detection**: At the instruction boundary of stage 5, the CPU evaluates `InterruptController.hasPending()`.
3. **Context Save**:
   - Current `PC` is written to `Memory[SP]`; `SP <- SP - 1`
   - Packed `FLAGS` are written to `Memory[SP]`; `SP <- SP - 1`
4. **Vector Lookup**: The CPU reads `Memory[0x0004]` (yielding `0x0200`) and loads `PC <- 0x0200`.
5. **ISR Execution**: The Interrupt Service Routine at `0x0200` executes:
   - Saves R0 and interrupted signals in scratch RAM; gives yellow warning
   - Reads `0xF020` to detect emergency lane
   - Turns all signals RED and waits for clearance
   - Turns emergency lane GREEN
   - Waits for vehicle clearance
   - Returns through yellow and all-red clearance, then restores saved signals and R0
   - Writes `1` to `0xF021` (Emergency Ack)
   - Executes `IRET`
6. **Context Restore**: `IRET` pops `FLAGS` and `PC` from the stack, restoring `SP` and continuing the interrupted program seamlessly.

---

## 19. TRAFFIC SIMULATION

The cyber-physical traffic intersection features:
- Four approach directions: North, South, East, West.
- Each approach possesses independent vehicle queues, arrival generation probabilities, and 3-color signal heads (Red, Yellow, Green).
- Vehicles depart only when the corresponding signal is GREEN.
- The assembly program chooses traffic phases; the traffic controller enforces signal-write interlocks and models vehicles; it exposes sensor counts to addresses `0xF000–0xF003` and reads light states from addresses `0xF010–0xF013`.

---

## 20. IMPLEMENTATION DETAILS

- **Backend**: Implemented in modular ES Modules using Node.js, Express, Socket.IO, and `node:sqlite`.
- **Database**: Relational SQLite tables (`sessions`, `cpu_logs`, `traffic_stats`, `emergency_events`, `settings`) maintain persistent telemetry.
- **Frontend**: Single-Page Application (SPA) built with React 18, Vite, and Tailwind CSS.
- **Real-Time Streaming**: Socket.IO broadcasts CPU state deltas, stage transitions, and traffic movement.

---

## 21. SCREENSHOTS & USER INTERFACE BREAKDOWN

The application provides eight dedicated interface views:
1. **Overview Dashboard**: High-level telemetry badges, active green signal, 4-way intersection canvas, register file, and recent execution trace.
2. **CPU Architecture View**: Detailed register file with binary representation, visual ALU trapezoid with active micro-operations, status flags, and Interrupt Vector Table.
3. **Instruction Execution View**: Interactive assembly code editor, line pointer, and full trace log table.
4. **Datapath Visualization View**: Real-time architectural schematic highlighting PC, Control Unit, IR, ALU, Register File, and active buses per stage.
5. **Traffic Intersection View**: Interactive 4-way asphalt intersection with moving cars, signal lights, queue counters, and emergency trigger buttons.
6. **Memory & I/O View**: 65,536-slot memory hex dump explorer and Memory-Mapped I/O register inspection table.
7. **Analytics View**: Recharts-powered instruction frequency bar charts, traffic throughput over time, and emergency event logs from SQLite.
8. **Settings View**: Execution speed slider (20ms to 1000ms), approach vehicle spawn rate controls, and system specifications.

---

## 22. TESTING AND RESULTS

Testing was conducted using Vitest and Supertest across 7 test suites comprising 30 automated tests:
- **Register Unit Tests**: 4/4 Passed
- **ALU Unit Tests**: 7/7 Passed (including safe division by zero)
- **Memory & I/O Tests**: 4/4 Passed
- **Instruction Execution & Branching Tests**: 4/4 Passed
- **Interrupt System & ISR Tests**: 1/1 Passed
- **Traffic & CPU Integration Tests**: 4/4 Passed
- **Backend REST API & Database Tests**: 7/7 Passed
- **Regression Tests**: 34/34 Passed
- **API Validation Tests**: 12/12 Passed
- **Overall Result**: **77 Passed / 77 Total across 9 test files**
- Frontend production build passed; live HTTP and Socket.IO smoke tests are recorded in Testing_Report.md. Browser rendering and Windows scripts were not executed in this environment.

---

## 23. LIMITATIONS

1. **Instruction Pipelining**: The CPU models a sequential 5-stage instruction cycle rather than a superscalar pipelined architecture with hazard detection and branch prediction.
2. **Address Space**: Limited to 65,536-slot (16-bit addressing), which is ideal for educational demonstrations but insufficient for general-purpose desktop operating systems.
3. **Floating Point Support**: Arithmetic operations are restricted to 16-bit signed/unsigned integers; floating-point math (IEEE 754) is not implemented.

---

## 24. FUTURE ENHANCEMENTS

1. **Pipelined Execution with Hazard Unit**: Implement pipeline registers (`IF/ID`, `ID/EX`, `EX/MEM`, `MEM/WB`) with data forwarding and branch hazard stalls.
2. **Direct Memory Access (DMA)**: Add a DMA controller to stream sensor data directly into RAM buffers without CPU polling overhead.
3. **Multi-Intersection Network**: Expand the CPU's memory-mapped I/O to control an entire grid of synchronized intersections with green-wave traffic coordination.

---

## 25. CONCLUSION

The **Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU** successfully demonstrates core Computer Organization and Architecture principles in an engaging, observable, and academically rigorous format. By integrating a custom 16-bit CPU, condition-code ALU, two-pass assembler, memory-mapped I/O, and hardware interrupt preemption with an authentic cyber-physical traffic intersection, the project transforms abstract computer architecture theory into a tangible, working engineering reality.

---

## 26. REFERENCES

1. Patterson, D. A., & Hennessy, J. L. (2020). *Computer Organization and Design: The Hardware/Software Interface* (6th ed.). Morgan Kaufmann.
2. Stallings, W. (2018). *Computer Organization and Architecture: Designing for Performance* (11th ed.). Pearson.
3. Tanenbaum, A. S., & Austin, T. (2012). *Structured Computer Organization* (6th ed.). Prentice Hall.
4. Mano, M. M. (2017). *Computer System Architecture* (3rd ed.). Pearson India.
5. Official Node.js Documentation on Native SQLite: https://nodejs.org/api/sqlite.html

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
