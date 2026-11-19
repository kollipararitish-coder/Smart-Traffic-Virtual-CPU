# Fixes and verification — 16 November 2026

Existing React dashboard, CPU modules, traffic program, SQLite persistence and project structure are preserved.

| Area | Correction |
|---|---|
| Emergency WAIT | Suspend the interrupted delay immediately; restore remaining ticks on IRET. |
| ISR context | Preserve R0 and signal phase in reserved scratch RAM; perform warning/clearance before priority and clearance before restoration. |
| Repeated emergency | Reject a second in-flight event; validate ISR availability before insertion. |
| Scheduler | Run/Step share time integration; prevent duplicate CPU timers and stepping while running. |
| Traffic | Clamp red-light stopping position, preserve incoming lane spacing, and count completed vehicles' wait only. |
| Interlock | Reject simultaneous non-red approaches; halt with all-red on runtime faults. |
| Analytics | Persist continuous-run instructions; save totals before reset; record emergency ACK completion. |
| Program loading | Validate before state changes; preserve previous source after assembly failure. |
| Assembler | Reject malformed literals/registers/counts, overlapping ORG regions and invalid ranges; honor first instruction origin. |
| ISA | Match metadata to five sequential stage cycles; correct signed multiplication overflow. |
| Lifecycle | Preserve HALTED state through pause; require reset/load; reset stale datapath/error state. |
| I/O | Live queue and system-clock dumps; validate signal writes before committing actuator latch. |
| API/UI | Validate inputs, catch socket errors, reject HTTP errors visibly, show true emergency status, select datapath snapshots. |
| Installation | Node 24 contract, lockfile installation, port 5174 consistency, backend serves built dashboard. |
| Documentation | Correct sequential-cycle, memory-slot and timing claims; document policy and simulation limits. |

See Testing_Report.md for commands and observed results. This is a software correctness pass with explicit limits, not proof of real-world road safety or a claim that every possible input is covered.
