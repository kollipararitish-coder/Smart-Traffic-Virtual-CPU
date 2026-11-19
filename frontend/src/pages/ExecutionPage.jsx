/**
 * ExecutionPage.jsx
 * Instruction-Level Execution, Assembly Source Editor, and Step Trace
 */

import React from 'react';
import { AssemblyViewer } from '../components/AssemblyViewer.jsx';
import { TraceTable } from '../components/TraceTable.jsx';
import { PlaySquare, Terminal, Layers } from 'lucide-react';

export const ExecutionPage = ({ programSource, cpuState, onLoadProgram }) => {
  const currentInstr = cpuState?.currentInstruction;
  const stage = cpuState?.currentStage || 'FETCH';

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Current Instruction & Stage Overview */}
      <div className="bg-dark-850 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-slate-400 text-[10px]">CURRENT INSTRUCTION IN IR:</div>
            <div className="text-sm font-bold text-slate-100">
              {currentInstr ? `${currentInstr.mnemonic} ${currentInstr.op1 ?? ''} ${currentInstr.op2 !== undefined ? ', ' + currentInstr.op2 : ''}` : 'NO INSTRUCTION'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-slate-400 text-[10px]">PROGRAM COUNTER:</div>
            <div className="text-sm font-bold text-amber-300">
              0x{((cpuState?.registers?.PC ?? 0x20)).toString(16).toUpperCase().padStart(4, '0')}
            </div>
          </div>

          <div className="text-right">
            <div className="text-slate-400 text-[10px]">PIPELINE STAGE:</div>
            <div className="text-sm font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              {stage}
            </div>
          </div>
        </div>
      </div>

      {/* Assembly Source Editor & Inspector */}
      <div>
        <AssemblyViewer
          programSource={programSource}
          cpuState={cpuState}
          onLoadProgram={onLoadProgram}
        />
      </div>

      {/* Full Trace History */}
      <div>
        <TraceTable traceHistory={cpuState?.recentTrace} />
      </div>

    </div>
  );
};
