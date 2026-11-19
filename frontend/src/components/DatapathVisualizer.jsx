/**
 * DatapathVisualizer.jsx
 * Interactive Architectural Datapath & Bus System Visualization
 * Highlights hardware modules and active buses during the 5 instruction stages.
 */

import React, { useState } from 'react';
import { 
  GitBranch, 
  Cpu, 
  Database, 
  Calculator, 
  Sliders, 
  Layers, 
  ArrowRight, 
  HelpCircle 
} from 'lucide-react';

export const DatapathVisualizer = ({ cpuState }) => {
  const [selectedStage, setSelectedStage] = useState('FETCH');
  const stage = selectedStage;
  const datapath = cpuState?.activeDatapath;
  const currentInstr = cpuState?.currentInstruction;
  const stageData = datapath?.stages?.[stage] || {};

  const activeComponents = stageData.activeComponents || [];
  const activeBuses = stageData.activeBuses || [];

  const isCompActive = (name) => activeComponents.includes(name);
  const isBusActive = (name) => activeBuses.includes(name);

  const stagesList = [
    { key: 'FETCH', label: '1. FETCH', desc: 'Read instruction at PC from memory into IR' },
    { key: 'DECODE', label: '2. DECODE', desc: 'Control Unit decodes opcode & reads registers' },
    { key: 'EXECUTE', label: '3. EXECUTE', desc: 'ALU computation or branch target evaluation' },
    { key: 'MEMORY', label: '4. MEMORY', desc: 'Data RAM or I/O port read / write' },
    { key: 'WRITEBACK', label: '5. WRITE BACK', desc: 'Write result to destination register' },
  ];

  return (
    <div className="bg-dark-850 rounded-xl border border-slate-800 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            CPU DATAPATH & BUS ARCHITECTURE
          </h3>
        </div>
        <div className="flex items-center space-x-1 font-mono text-xs">
          <span className="text-slate-400">INSPECT STAGE:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
            {stage}
          </span>
        </div>
      </div>

      {/* Five-stage instruction snapshot selector */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {stagesList.map((s) => {
          const isCurrent = stage === s.key;
          return (
            <div
              key={s.key}
              role="button" tabIndex={0}
              onClick={() => setSelectedStage(s.key)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedStage(s.key); }}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                isCurrent
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : 'bg-dark-900 border-slate-800 text-slate-400 opacity-60'
              }`}
            >
              <div className="text-xs font-bold font-mono">{s.label}</div>
              <div className="text-[10px] truncate mt-0.5">{s.desc}</div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mb-3">Select a stage from the last executed instruction. One step executes one complete instruction or one WAIT tick.</p>
      <div className="overflow-x-auto">
      {/* Datapath Hardware Diagram (SVG / Flex Grid) */}
      <div className="bg-dark-900 p-6 rounded-xl border border-slate-800 relative min-h-[360px] min-w-[680px] flex flex-col justify-between overflow-hidden">
        
        {/* Top Tier: Program Counter & Control Unit */}
        <div className="flex justify-between items-center z-10">
          
          {/* PC Block */}
          <div className={`p-4 rounded-xl border-2 transition-all w-44 ${
            isCompActive('PC')
              ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-400/20 text-cyan-200'
              : 'border-slate-700 bg-dark-850 text-slate-400'
          }`}>
            <div className="text-[11px] font-mono font-bold flex items-center justify-between">
              <span>PROGRAM COUNTER</span>
              <span className="text-[9px] px-1 bg-slate-800 rounded">PC</span>
            </div>
            <div className="text-lg font-mono font-bold text-slate-100 mt-1">
              0x{((cpuState?.registers?.PC ?? 0x20)).toString(16).toUpperCase().padStart(4, '0')}
            </div>
          </div>

          {/* Control Unit */}
          <div className={`p-4 rounded-xl border-2 transition-all w-60 ${
            isCompActive('ControlUnit')
              ? 'border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-400/20 text-indigo-200'
              : 'border-slate-700 bg-dark-850 text-slate-400'
          }`}>
            <div className="text-[11px] font-mono font-bold flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>CONTROL UNIT (CU)</span>
            </div>
            <div className="text-xs text-slate-300 font-mono mt-1 truncate">
              {currentInstr?.mnemonic || 'DECODING'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex space-x-2 font-mono">
              <span>ALU: {cpuState?.currentSignals?.ALUOp || 'NONE'}</span>
              <span>RegWrite: {cpuState?.currentSignals?.RegWrite ?? 0}</span>
            </div>
          </div>

          {/* Instruction Register */}
          <div className={`p-4 rounded-xl border-2 transition-all w-44 ${
            isCompActive('IR')
              ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-400/20 text-amber-200'
              : 'border-slate-700 bg-dark-850 text-slate-400'
          }`}>
            <div className="text-[11px] font-mono font-bold flex items-center justify-between">
              <span>INSTR REGISTER</span>
              <span className="text-[9px] px-1 bg-slate-800 rounded">IR</span>
            </div>
            <div className="text-sm font-mono font-bold text-amber-300 mt-1 truncate">
              {currentInstr ? `${currentInstr.mnemonic} ${currentInstr.op1 ?? ''}` : 'EMPTY'}
            </div>
          </div>

        </div>

        {/* Middle Tier: System Buses Representation */}
        <div className="py-4 my-2 z-10 space-y-2">
          {/* Address Bus */}
          <div className={`h-4 rounded px-3 flex items-center justify-between text-[10px] font-mono transition-all ${
            isBusActive('AddressBus')
              ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-400/30 animate-pulse'
              : 'bg-dark-850 border border-slate-800 text-slate-400'
          }`}>
            <span>ADDRESS BUS (16-bit)</span>
            <span>{isBusActive('AddressBus') ? 'ACTIVE' : 'IDLE'}</span>
          </div>

          {/* Data Bus */}
          <div className={`h-4 rounded px-3 flex items-center justify-between text-[10px] font-mono transition-all ${
            isBusActive('DataBus') || isBusActive('InternalDataBus')
              ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-400/30 animate-pulse'
              : 'bg-dark-850 border border-slate-800 text-slate-400'
          }`}>
            <span>DATA BUS (16-bit)</span>
            <span>{isBusActive('DataBus') || isBusActive('InternalDataBus') ? 'DATA TRANSMISSION' : 'IDLE'}</span>
          </div>

          {/* Control Bus */}
          <div className={`h-4 rounded px-3 flex items-center justify-between text-[10px] font-mono transition-all ${
            isBusActive('ControlBus')
              ? 'bg-indigo-500/30 border border-indigo-400 text-indigo-200 shadow-sm shadow-indigo-400/30'
              : 'bg-dark-850 border border-slate-800 text-slate-400'
          }`}>
            <span>CONTROL BUS (Micro-Signals)</span>
            <span>{isBusActive('ControlBus') ? 'SIGNALS ASSERTED' : 'IDLE'}</span>
          </div>
        </div>

        {/* Bottom Tier: Registers, ALU, Memory & I/O */}
        <div className="flex justify-between items-center z-10">
          
          {/* Register File */}
          <div className={`p-4 rounded-xl border-2 transition-all w-52 ${
            isCompActive('Registers')
              ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-400/20 text-emerald-200'
              : 'border-slate-700 bg-dark-850 text-slate-400'
          }`}>
            <div className="text-[11px] font-mono font-bold flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>REGISTER FILE</span>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-1 flex justify-between">
              <span>ACC: {cpuState?.registers?.ACC ?? 0}</span>
              <span>R0: {cpuState?.registers?.R0 ?? 0}</span>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-0.5 flex justify-between">
              <span>R1: {cpuState?.registers?.R1 ?? 0}</span>
              <span>R2: {cpuState?.registers?.R2 ?? 0}</span>
            </div>
          </div>

          {/* ALU */}
          <div className={`p-4 rounded-xl border-2 transition-all w-48 ${
            isCompActive('ALU')
              ? 'border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-400/20 text-indigo-200'
              : 'border-slate-700 bg-dark-850 text-slate-400'
          }`}>
            <div className="text-[11px] font-mono font-bold flex items-center space-x-1.5">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>ALU</span>
            </div>
            <div className="text-sm font-mono font-extrabold text-indigo-300 mt-1">
              {cpuState?.currentSignals?.ALUOp || 'IDLE'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Updates Flags: Z, C, N, V
            </div>
          </div>

          {/* Memory System & I/O */}
          <div className={`p-4 rounded-xl border-2 transition-all w-52 ${
            isCompActive('Memory') || isCompActive('IOController')
              ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-400/20 text-amber-200'
              : 'border-slate-700 bg-dark-850 text-slate-400'
          }`}>
            <div className="text-[11px] font-mono font-bold flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>MEMORY & I/O</span>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-1">
              65,536-slot Unified Address Space
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              I/O: 0xF000 - 0xF030
            </div>
          </div>

        </div>

      </div>

      </div>
      {/* Live Dataflow Description Banner */}
      <div className="mt-4 p-3 bg-dark-900 rounded-lg border border-slate-800 text-xs font-mono flex items-center space-x-3">
        <ArrowRight className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
        <div>
          <span className="text-slate-400">ACTIVE DATA MOVEMENT: </span>
          <span className="text-slate-100 font-semibold">
            {stageData.dataMovement || 'CPU is holding clock state.'}
          </span>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stageData.controlDescription || ''}
          </div>
        </div>
      </div>
    </div>
  );
};
