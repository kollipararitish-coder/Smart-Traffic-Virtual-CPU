/**
 * AluFlagsView.jsx
 * Visual ALU Schematic and Functional Operation Display
 */

import React from 'react';
import { Calculator, ArrowRight, ArrowDown } from 'lucide-react';

export const AluFlagsView = ({ cpuState, lastTrace }) => {
  const currentInstr = cpuState?.currentInstruction;
  const signals = cpuState?.currentSignals || {};
  const aluOp = signals.ALUOp || 'IDLE';
  const aluResult = lastTrace?.aluResult ?? null;
  const flags = cpuState?.registers?.FLAGS || { Z: 0, C: 0, N: 0, V: 0 };

  const isAluActive = !!signals.ALUOp;

  return (
    <div className="bg-dark-850 rounded-xl border border-slate-800 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">ARITHMETIC LOGIC UNIT (ALU)</h3>
        </div>
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
          isAluActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {isAluActive ? `ACTIVE: ${aluOp}` : 'IDLE'}
        </span>
      </div>

      {/* Schematic Diagram */}
      <div className="relative bg-dark-900 rounded-lg p-6 border border-slate-800 flex flex-col items-center">
        
        {/* Input Buses A and B */}
        <div className="flex justify-between w-full max-w-sm mb-2 text-xs font-mono">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[11px]">Operand A</span>
            <span className="px-2.5 py-1 bg-dark-850 border border-slate-700 rounded text-cyan-300 font-bold mt-1">
              {currentInstr?.op1 ?? '---'}
            </span>
            <ArrowDown className="w-4 h-4 text-cyan-400 mt-1 animate-bounce" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[11px]">Operand B</span>
            <span className="px-2.5 py-1 bg-dark-850 border border-slate-700 rounded text-amber-300 font-bold mt-1">
              {currentInstr?.op2 !== undefined ? `${currentInstr.op2}` : '---'}
            </span>
            <ArrowDown className="w-4 h-4 text-amber-400 mt-1 animate-bounce" />
          </div>
        </div>

        {/* ALU Trapezoid / V-Shape Representation */}
        <div className={`w-64 h-24 relative flex flex-col items-center justify-center rounded-lg border-2 transition-all ${
          isAluActive
            ? 'border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/20'
            : 'border-slate-700 bg-dark-850'
        }`}>
          <div className="text-xs font-mono font-bold text-slate-400">16-BIT INTEGER ALU</div>
          <div className="text-lg font-mono font-extrabold text-indigo-400 mt-1">
            {aluOp}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            {isAluActive ? 'Executing micro-op' : 'Datapath bypass'}
          </div>
        </div>

        {/* Output Result Bus */}
        <div className="flex flex-col items-center mt-2 text-xs font-mono w-full max-w-sm">
          <ArrowDown className={`w-4 h-4 mt-1 ${isAluActive ? 'text-indigo-400 animate-bounce' : 'text-slate-600'}`} />
          <div className="flex items-center justify-between w-full mt-2 bg-dark-850 px-4 py-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">ALU Output:</span>
            <span className="font-bold text-base text-emerald-400">
              {aluResult !== null ? `0x${aluResult.toString(16).toUpperCase().padStart(4, '0')} (${aluResult})` : '---'}
            </span>
          </div>
        </div>

        {/* Flags Line */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-around font-mono text-xs">
          <span className="text-slate-400 text-[11px]">Updated Flags:</span>
          {['Z', 'C', 'N', 'V'].map(flagKey => (
            <span
              key={flagKey}
              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                flags[flagKey] === 1
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-dark-850 text-slate-400 border-slate-800'
              }`}
            >
              {flagKey}: {flags[flagKey] ?? 0}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
};
