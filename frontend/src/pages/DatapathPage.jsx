/**
 * DatapathPage.jsx
 * Full Hardware Datapath & Control Signal Diagnostics Page
 */

import React from 'react';
import { DatapathVisualizer } from '../components/DatapathVisualizer.jsx';
import { GitBranch, Sliders } from 'lucide-react';

export const DatapathPage = ({ cpuState }) => {
  const signals = cpuState?.currentSignals || {};

  const signalItems = [
    { name: 'RegWrite', val: signals.RegWrite ?? 0, desc: 'Enables writing computed data into destination register' },
    { name: 'MemRead', val: signals.MemRead ?? 0, desc: 'Enables reading data from Data RAM' },
    { name: 'MemWrite', val: signals.MemWrite ?? 0, desc: 'Enables writing data to Data RAM' },
    { name: 'IORead', val: signals.IORead ?? 0, desc: 'Enables reading sensor data from I/O port' },
    { name: 'IOWrite', val: signals.IOWrite ?? 0, desc: 'Enables outputting signal actuator state to I/O port' },
    { name: 'Branch', val: signals.Branch ?? 0, desc: 'Asserts branch evaluation control signal' },
    { name: 'ALUSrc', val: signals.ALUSrc || 'REG', desc: 'Selects second ALU input: Register vs Immediate' },
    { name: 'ALUOp', val: signals.ALUOp || 'NONE', desc: 'Active operation asserted to ALU functional unit' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Interactive Datapath Visualizer */}
      <DatapathVisualizer cpuState={cpuState} />

      {/* Control Signals Inspection Panel */}
      <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            CONTROL UNIT SIGNALS & MICRO-OPERATIONS
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          {signalItems.map((sig) => (
            <div key={sig.name} className="bg-dark-900 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[10px]">{sig.name}</div>
              <div className="text-base font-bold text-cyan-300 mt-1">{sig.val}</div>
              <div className="text-[10px] text-slate-400 mt-1">{sig.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
