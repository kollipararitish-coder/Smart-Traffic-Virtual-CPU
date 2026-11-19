# Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU

> **A Complete Computer Organization and Architecture (COA) Academic Project**  
> *Built from scratch with clean modular architecture, 16-bit Virtual CPU, five-stage sequential instruction cycle, 4-way traffic simulation, hardware interrupt preemption, SQLite persistence, and full-stack React dashboard.*

---

## 🚦 1. Project Overview

This project is a complete, working academic demonstration of **Computer Organization and Architecture (COA)** principles. Rather than relying on simple scripts, cosmetic animations, or an Intel 8086 emulator, this system implements a custom **16-bit Instruction-Level Virtual CPU** from scratch in JavaScript.

The virtual CPU executes an orthogonal 28-mnemonic Instruction Set Architecture (ISA). It directly controls a physical 4-way traffic intersection via **Memory-Mapped I/O**:
- The CPU reads vehicle queue sensors from memory addresses `0xF000–0xF003`.
- The CPU evaluates queue priorities using comparison instructions (`CMP`, `JGT`).
- The CPU controls physical traffic lights by writing signal codes to addresses `0xF010–0xF013`.
- Emergency vehicles assert hardware interrupt requests (`IRQ` Vector `0x0004`), causing the CPU to save context to a hardware call stack, execute an **Interrupt Service Routine (ISR)**, and return smoothly via `IRET`.

---

## 🛠️ 2. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: SQLite (Node.js Native `DatabaseSync` engine)
- **CPU Engine**: Modular 16-bit Virtual CPU (Registers, ALU, Control Unit, Memory, PIC, Assembler)
- **Testing**: Vitest v3.2.7 & Supertest v7.0.0
- **Platform**: Windows 10 / 11 (64-bit) — Zero cloud, GPU, or paid API dependencies

---

## 🧠 3. Core CPU Architecture

- **Registers**:
  - `PC` (Program Counter)
  - `IR` (Instruction Register)
  - `ACC` (Accumulator)
  - `R0, R1, R2, R3` (General Purpose Registers)
  - `SP` (Stack Pointer, starts at `0x8FFF`)
  - `FLAGS`: Zero (`Z`), Carry (`C`), Negative (`N`), Overflow (`V`)
  - `CLOCK`: Total executed clock cycles
- **ALU**:
  - 16-bit operations: `ADD`, `SUB`, `MUL`, `DIV`, `AND`, `OR`, `XOR`, `NOT`, `CMP`, `INC`, `DEC`
  - Safe division by zero check (sets `V=1`, returns 0)
- **five-stage sequential instruction cycle Cycle**:
  1. `FETCH`: `AddressBus <- PC; IR <- Memory[PC]; PC <- PC + 1`
  2. `DECODE`: Control Unit decodes opcode and asserts micro-signals
  3. `EXECUTE`: ALU computation or branch target evaluation
  4. `MEMORY`: Data RAM or Memory-Mapped I/O read/write across Data Bus
  5. `WRITE BACK`: Result committed to destination register `Rd`
- **Memory Organization (65,536-slot)**:
  - `0x0000 – 0x001F`: Interrupt Vector Table (`0x0000`: Reset, `0x0004`: Emergency ISR)
  - `0x0020 – 0x1FFF`: Program Code Memory
  - `0x2000 – 0x7FFF`: Data Memory
  - `0x8000 – 0x8FFF`: Hardware Call Stack
  - `0xF000 – 0xF0FF`: Memory-Mapped I/O (Sensors & Actuators)

---

## 📁 4. Project Structure

```
smart-traffic-virtual-cpu/
│
├── backend/
│   ├── src/
│   │   ├── cpu/
│   │   │   ├── Registers.js            # 16-bit Register File & Status Flags
│   │   │   ├── ALU.js                  # Arithmetic Logic Unit
│   │   │   ├── Memory.js               # 65,536-slot RAM & Memory-Mapped I/O Map
│   │   │   ├── InstructionSet.js       # 28-Mnemonic ISA Definitions
│   │   │   ├── ControlUnit.js          # Micro-signal Decoder & Datapath Signals
│   │   │   ├── InterruptController.js  # Programmable Interrupt Controller (PIC)
│   │   │   ├── Assembler.js            # Two-pass Symbolic Assembler
│   │   │   └── CPU.js                  # Master CPU Engine (5-Stage Cycle)
│   │   │
│   │   ├── traffic/
│   │   │   ├── TrafficProgram.js       # Default Assembly Traffic & ISR Program
│   │   │   └── TrafficController.js    # 4-Way Intersection Cyber-Physical Simulation
│   │   │
│   │   ├── services/
│   │   │   └── SimulationService.js    # Simulation Orchestrator & Socket.IO Sync
│   │   │
│   │   ├── database/
│   │   │   └── database.js             # SQLite Database Persistence Engine
│   │   │
│   │   ├── routes/
│   │   │   └── routes.js               # Express REST API Endpoints
│   │   │
│   │   └── server.js                   # Express & Socket.IO HTTP Server
│   │
│   ├── tests/
│   │   ├── registers.test.js           # Register Unit Tests
│   │   ├── alu.test.js                 # ALU & Flag Unit Tests
│   │   ├── memory.test.js              # Memory & I/O Tests
│   │   ├── instruction_and_cpu.test.js # ISA & Branching Tests
│   │   ├── interrupt.test.js           # Interrupt & ISR Stack Tests
│   │   ├── traffic_integration.test.js # Traffic & CPU Integration Tests
│   │   └── api_and_db.test.js          # REST API & SQLite Database Tests
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Navigation Header with Telemetry Badges
│   │   │   ├── ControlToolbar.jsx      # Step, Run, Pause, Reset, Speed & IRQ Controls
│   │   │   ├── RegisterGrid.jsx        # Visual Register File & Status Flags
│   │   │   ├── AluFlagsView.jsx        # Interactive ALU Schematic
│   │   │   ├── TrafficIntersectionView.jsx # 4-Way Animated Traffic Intersection
│   │   │   ├── DatapathVisualizer.jsx  # Architectural Datapath & Bus Visualizer
│   │   │   ├── AssemblyViewer.jsx      # Assembly Source Code Inspector & Loader
│   │   │   └── TraceTable.jsx          # Real-time Execution Trace Table
│   │   │
│   │   ├── pages/
│   │   │   ├── OverviewPage.jsx        # Unified Overview Dashboard
│   │   │   ├── ArchitecturePage.jsx    # Registers, ALU & PIC Diagnostics
│   │   │   ├── ExecutionPage.jsx       # Assembly Program & Step Execution
│   │   │   ├── DatapathPage.jsx        # 5-Stage Datapath & Bus Activity
│   │   │   ├── IntersectionPage.jsx    # Advanced Intersection Approach Controls
│   │   │   ├── MemoryPage.jsx          # 65,536-slot Memory & I/O Port Inspector
│   │   │   ├── AnalyticsPage.jsx       # SQLite Charts (Workload & Throughput)
│   │   │   └── SettingsPage.jsx        # Clock Speed & Spawn Rate Settings
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                  # REST API Client
│   │   │   └── socket.js               # Socket.IO Client Singleton
│   │   │
│   │   ├── App.jsx                     # Master Controller
│   │   ├── main.jsx                    # React Entrypoint
│   │   └── index.css                   # Tailwind & Engineering Styling
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── docs/
│   ├── Project_Report.md               # 26-Section Complete Academic Project Report
│   ├── Architecture.md                 # Hardware Subsystem Specification
│   ├── Instruction_Set.md              # 28-Mnemonic ISA Reference Table
│   ├── COA_Concept_Mapping.md          # Syllabus Concept Mapping Guide
│   ├── API_Documentation.md            # REST API & Socket.IO Reference
│   ├── Testing_Report.md               # Automated Verification & Test Results
│   ├── Installation_Guide.md           # Windows 10/11 Setup Guide
│   ├── Viva_Questions.md               # Comprehensive Defense Q&A
│   └── Presentation.html               # Standalone Interactive Slide Deck
│
├── scripts/
│   ├── install.bat                     # Windows Dependency Installer & Verifier
│   └── start.bat                       # Windows 1-Click Server & Browser Launcher
│
├── README.md
├── package.json                        # Root Conveniences Scripts
└── .gitignore
```

---

## 🚀 5. Quick Start (Node.js 24+)

### Option A: One-Click Windows Batch Scripts (Recommended)
1. Extract `Smart-Traffic-Virtual-CPU.zip`.
2. Run `scripts\install.bat` to install dependencies and run tests.
3. Run `scripts\start.bat` to launch the servers and open the dashboard in your browser.
4. Access the dashboard at: **`http://localhost:5174`**

### Option B: Manual Command Line
```cmd
# 1. Install & test backend
cd backend
npm ci
npm test
npm start

# 2. In another terminal, install & run frontend
cd frontend
npm ci
npm run dev
```

---

## 🧪 6. Automated Testing Suite

Execute the test suite at any time:
```cmd
cd backend
npm test
```
**Results: 9 Test Files Passed, 77 Tests Passed**

---

## 📚 7. Academic Documentation Links

- [Complete Project Report (26 Sections)](docs/Project_Report.md)
- [COA Concept Mapping](docs/COA_Concept_Mapping.md)
- [Instruction Set Architecture (ISA)](docs/Instruction_Set.md)
- [System Architecture Specification](docs/Architecture.md)
- [Viva Questions & Model Answers](docs/Viva_Questions.md)
- [Automated Testing Report](docs/Testing_Report.md)
- [Interactive Presentation Slides](docs/Presentation.html)

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


### One-server launch (Windows, Linux, macOS)

From the extracted project folder:

```bash
npm run install:all
npm test
npm run build:frontend
npm run start:backend
```

Open **http://localhost:5000**. The original Windows two-terminal scripts remain available. See [fix details](docs/Fixes_and_Verification.md) and [test report](docs/Testing_Report.md).
