/**
 * TrafficProgram.js
 * Default Assembly Program for Educational Virtual CPU Traffic Controller
 * Implements balanced, realistic timing intervals:
 * - Green Phase: 40 scheduler ticks (~4.0s) for steady vehicle departure
 * - Yellow Warning: 15 scheduler ticks (~1.5s)
 * - All-Red Clearance: 10 scheduler ticks (~1.0s) for safe intersection clearance
 * - Emergency ISR: Prioritized preemption with full clearance
 */

export const DEFAULT_TRAFFIC_PROGRAM = `; ===================================================================
; SMART TRAFFIC SIGNAL CONTROLLER - COA VIRTUAL CPU ASSEMBLY PROGRAM
; Controls 4-way intersection (North, South, East, West)
; Evaluates vehicle queue sensors, dynamically prioritizes highest queue,
; enforces safety transitions (Yellow & All-Red), and handles
; Emergency Vehicle Interrupt Service Routine (ISR).
; ===================================================================

; --- Hardware I/O Ports ---
NORTH_COUNT       EQU 0xF000
SOUTH_COUNT       EQU 0xF001
EAST_COUNT        EQU 0xF002
WEST_COUNT        EQU 0xF003

NORTH_SIGNAL      EQU 0xF010
SOUTH_SIGNAL      EQU 0xF011
EAST_SIGNAL       EQU 0xF012
WEST_SIGNAL       EQU 0xF013

EMERGENCY_STATUS  EQU 0xF020
EMERGENCY_ACK     EQU 0xF021

; --- Signal Encoding Constants ---
SIGNAL_RED        EQU 0
SIGNAL_YELLOW     EQU 1
SIGNAL_GREEN      EQU 2

; ===================================================================
; MAIN PROGRAM (Entry Address: 0x0020)
; ===================================================================
ORG 0x0020

MAIN_LOOP:
  ; Step 1: Read queue sensors from memory-mapped I/O
  IN R0, [NORTH_COUNT]
  IN R1, [SOUTH_COUNT]

  ; Step 2: Compare North (R0) vs South (R1)
  CMP R0, R1
  JGT CHECK_NORTH_EAST

  ; South >= North: Read East and compare South (R1) vs East (R2)
  IN R2, [EAST_COUNT]
  CMP R1, R2
  JGT CHECK_SOUTH_WEST

  ; East might be greatest: Read West and compare East (R2) vs West (R3)
  IN R3, [WEST_COUNT]
  CMP R2, R3
  JGT SET_EAST_PHASE
  JMP SET_WEST_PHASE

CHECK_NORTH_EAST:
  IN R2, [EAST_COUNT]
  CMP R0, R2
  JGT CHECK_NORTH_WEST
  IN R3, [WEST_COUNT]
  CMP R2, R3
  JGT SET_EAST_PHASE
  JMP SET_WEST_PHASE

CHECK_NORTH_WEST:
  IN R3, [WEST_COUNT]
  CMP R0, R3
  JGT SET_NORTH_PHASE
  JMP SET_WEST_PHASE

CHECK_SOUTH_WEST:
  IN R3, [WEST_COUNT]
  CMP R1, R3
  JGT SET_SOUTH_PHASE
  JMP SET_WEST_PHASE

; --- Phase: North Green (Hold ~4s for car departures) ---
SET_NORTH_PHASE:
  OUT [SOUTH_SIGNAL], #0
  OUT [EAST_SIGNAL], #0
  OUT [WEST_SIGNAL], #0
  OUT [NORTH_SIGNAL], #2
  WAIT #40
  OUT [NORTH_SIGNAL], #1
  WAIT #15
  OUT [NORTH_SIGNAL], #0
  WAIT #10
  JMP MAIN_LOOP

; --- Phase: South Green ---
SET_SOUTH_PHASE:
  OUT [NORTH_SIGNAL], #0
  OUT [EAST_SIGNAL], #0
  OUT [WEST_SIGNAL], #0
  OUT [SOUTH_SIGNAL], #2
  WAIT #40
  OUT [SOUTH_SIGNAL], #1
  WAIT #15
  OUT [SOUTH_SIGNAL], #0
  WAIT #10
  JMP MAIN_LOOP

; --- Phase: East Green ---
SET_EAST_PHASE:
  OUT [NORTH_SIGNAL], #0
  OUT [SOUTH_SIGNAL], #0
  OUT [WEST_SIGNAL], #0
  OUT [EAST_SIGNAL], #2
  WAIT #40
  OUT [EAST_SIGNAL], #1
  WAIT #15
  OUT [EAST_SIGNAL], #0
  WAIT #10
  JMP MAIN_LOOP

; --- Phase: West Green ---
SET_WEST_PHASE:
  OUT [NORTH_SIGNAL], #0
  OUT [SOUTH_SIGNAL], #0
  OUT [EAST_SIGNAL], #0
  OUT [WEST_SIGNAL], #2
  WAIT #40
  OUT [WEST_SIGNAL], #1
  WAIT #15
  OUT [WEST_SIGNAL], #0
  WAIT #10
  JMP MAIN_LOOP

; ===================================================================
; INTERRUPT SERVICE ROUTINE (ISR) FOR EMERGENCY VEHICLE PREEMPTION
; Hardware Interrupt Vector: 0x0004 -> Address: 0x0200
; ===================================================================
ORG 0x0200
EMERGENCY_ISR:
  ; ISR uses R0, so preserve it in reserved scratch RAM.
  STORE [0x2000], R0
  IN R0, [NORTH_SIGNAL]
  STORE [0x2001], R0
  IN R0, [SOUTH_SIGNAL]
  STORE [0x2002], R0
  IN R0, [EAST_SIGNAL]
  STORE [0x2003], R0
  IN R0, [WEST_SIGNAL]
  STORE [0x2004], R0
  ; Warn the currently green approach before clearing the intersection.
  LOAD R0, [0x2001]
  CMP R0, #2
  JNZ WARN_SOUTH
  OUT [NORTH_SIGNAL], #1
WARN_SOUTH:
  LOAD R0, [0x2002]
  CMP R0, #2
  JNZ WARN_EAST
  OUT [SOUTH_SIGNAL], #1
WARN_EAST:
  LOAD R0, [0x2003]
  CMP R0, #2
  JNZ WARN_WEST
  OUT [EAST_SIGNAL], #1
WARN_WEST:
  LOAD R0, [0x2004]
  CMP R0, #2
  JNZ WARN_DONE
  OUT [WEST_SIGNAL], #1
WARN_DONE:
  WAIT #15
  ; Read emergency lane direction from 0xF020
  ; 1 = North, 2 = South, 3 = East, 4 = West
  IN R0, [EMERGENCY_STATUS]

  ; Intersection clearance after yellow warning: All signals RED
  OUT [NORTH_SIGNAL], #0
  OUT [SOUTH_SIGNAL], #0
  OUT [EAST_SIGNAL], #0
  OUT [WEST_SIGNAL], #0
  WAIT #10

  ; Route emergency priority by approach direction
  CMP R0, #1
  JZ EM_NORTH
  CMP R0, #2
  JZ EM_SOUTH
  CMP R0, #3
  JZ EM_EAST
  CMP R0, #4
  JZ EM_WEST
  JMP EM_FINISH

EM_NORTH:
  OUT [NORTH_SIGNAL], #2
  WAIT #50
  OUT [NORTH_SIGNAL], #1
  WAIT #15
  OUT [NORTH_SIGNAL], #0
  JMP EM_FINISH

EM_SOUTH:
  OUT [SOUTH_SIGNAL], #2
  WAIT #50
  OUT [SOUTH_SIGNAL], #1
  WAIT #15
  OUT [SOUTH_SIGNAL], #0
  JMP EM_FINISH

EM_EAST:
  OUT [EAST_SIGNAL], #2
  WAIT #50
  OUT [EAST_SIGNAL], #1
  WAIT #15
  OUT [EAST_SIGNAL], #0
  JMP EM_FINISH

EM_WEST:
  OUT [WEST_SIGNAL], #2
  WAIT #50
  OUT [WEST_SIGNAL], #1
  WAIT #15
  OUT [WEST_SIGNAL], #0
  JMP EM_FINISH

EM_FINISH:
  ; Acknowledge emergency handling and clear interrupt line
  WAIT #10
  LOAD R0, [0x2001]
  OUT [NORTH_SIGNAL], R0
  LOAD R0, [0x2002]
  OUT [SOUTH_SIGNAL], R0
  LOAD R0, [0x2003]
  OUT [EAST_SIGNAL], R0
  LOAD R0, [0x2004]
  OUT [WEST_SIGNAL], R0
  LOAD R0, [0x2000]
  OUT [EMERGENCY_ACK], #1
  ; Return from Interrupt (IRET restores PC and FLAGS)
  IRET
`;
