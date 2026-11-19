/**
 * ControlToolbar.jsx
 * Interactive CPU Simulation Control Bar (Step, Run, Pause, Reset, Speed, Emergency)
 */

import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  Gauge, 
  AlertOctagon, 
  Terminal 
} from 'lucide-react';

export const ControlToolbar = ({ 
  cpuState, 
  onStep, 
  onRun, 
  onPause, 
  onReset, 
  onSetSpeed, 
  onTriggerEmergency 
}) => {
  const isRunning = cpuState?.state === 'RUNNING';
  const speedMs = cpuState?.clockSpeedMs || 100;
  const currentInstr = cpuState?.currentInstruction;

  return (
    <div className="bg-dark-850/90 backdrop-blur border-b border-slate-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Core CPU Execution Controls */}
        <div className="flex items-center space-x-2">
          {/* Single Step */}
          <button
            onClick={onStep}
            disabled={isRunning || !cpuState || cpuState.state === 'HALTED'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white font-medium text-xs shadow transition active:scale-95"
            title="Advance one instruction or one WAIT tick, together with traffic"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Single Step</span>
          </button>

          {/* Run / Pause Toggle */}
          {isRunning ? (
            <button
              onClick={onPause}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow transition active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onRun}
              disabled={!cpuState || cpuState.state === 'HALTED'}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run CPU</span>
            </button>
          )}

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs shadow transition active:scale-95"
            title="Reset CPU registers, memory, and simulation to documented initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Clock Speed Controls & Fast Presets */}
          <div className="flex items-center space-x-2 pl-3 border-l border-slate-700/80">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-mono text-slate-400">Speed:</span>
            <input
              type="range"
              min="5"
              max="300"
              step="5"
              value={speedMs}
              onChange={(e) => onSetSpeed(parseInt(e.target.value, 10))}
              className="w-16 accent-cyan-400 cursor-pointer"
              title={`${speedMs} ms per instruction cycle`}
            />
            <span className="text-[11px] font-mono text-cyan-300 w-10">{speedMs}ms</span>

            {/* Quick Speed Buttons */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => onSetSpeed(100)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${speedMs === 100 ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                title="1x Normal Speed (100ms)"
              >
                1x
              </button>
              <button
                type="button"
                onClick={() => onSetSpeed(50)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${speedMs === 50 ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                title="2x Fast Speed (50ms)"
              >
                2x
              </button>
              <button
                type="button"
                onClick={() => onSetSpeed(20)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${speedMs === 20 ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                title="5x Super Fast (20ms)"
              >
                5x
              </button>
              <button
                type="button"
                onClick={() => onSetSpeed(10)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${speedMs <= 10 ? 'bg-amber-500 text-dark-950 font-bold animate-pulse' : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'}`}
                title="10x Turbo Speed (10ms)"
              >
                ⚡Turbo
              </button>
            </div>
          </div>
        </div>

        {/* Current Instruction Display Badge */}
        <div className="hidden md:flex items-center space-x-2 bg-dark-900 px-3 py-1.5 rounded border border-slate-700/80 font-mono text-xs">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">PC [0x{((cpuState?.registers?.PC ?? 0x20)).toString(16).toUpperCase().padStart(4, '0')}]:</span>
          <span className="text-amber-300 font-semibold">
            {currentInstr ? `${currentInstr.mnemonic} ${currentInstr.op1 ?? ''} ${currentInstr.op2 !== undefined ? ', ' + currentInstr.op2 : ''}` : 'NO INSTRUCTION'}
          </span>
          {currentInstr?.opcode !== undefined && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              0x{currentInstr.opcode.toString(16).toUpperCase().padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Emergency Hardware IRQ Buttons */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-mono text-rose-400 flex items-center space-x-1 mr-1">
            <AlertOctagon className="w-3 h-3 text-rose-500" />
            <span>IRQ:</span>
          </span>
          {['North', 'South', 'East', 'West'].map((dir) => (
            <button
              key={dir}
              onClick={() => onTriggerEmergency(dir)}
              disabled={!cpuState || cpuState.state === 'HALTED' || cpuState.interruptState?.inService}
              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-mono transition active:scale-95"
              title={`Trigger Emergency Vehicle Interrupt on ${dir} Approach (Vector 0x0004)`}
            >
              {dir}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
