/**
 * ArchitecturePage.jsx
 * In-depth CPU Architecture & Hardware Subsystems View
 */

import React from 'react';
import { RegisterGrid } from '../components/RegisterGrid.jsx';
import { AluFlagsView } from '../components/AluFlagsView.jsx';
import { ShieldAlert, Database, Cpu, Layers } from 'lucide-react';

export const ArchitecturePage = ({ cpuState }) => {
  const intr = cpuState?.interruptState || {};
  const lastTrace = cpuState?.recentTrace?.[0];

  return (
    <div className="space-y-6">
      
      {/* Top Section: Register File & ALU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegisterGrid registers={cpuState?.registers} lastTrace={lastTrace} />
        <AluFlagsView cpuState={cpuState} lastTrace={lastTrace} />
      </div>

      {/* Bottom Section: Interrupt Controller & Memory Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Interrupt Controller Subsystem */}
        <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-slate-100 text-sm tracking-wide">
                PROGRAMMABLE INTERRUPT CONTROLLER (PIC)
              </h3>
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              intr.inService ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {intr.inService ? 'SERVICING ISR' : 'LISTENING'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 font-mono text-xs">
            <div className="bg-dark-900 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[10px]">PENDING IRQS</div>
              <div className="text-base font-bold text-slate-100 mt-1">{intr.pendingCount || 0}</div>
            </div>
            <div className="bg-dark-900 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[10px]">TOTAL HANDLED</div>
              <div className="text-base font-bold text-cyan-300 mt-1">{intr.stats?.totalInterruptsHandled || 0}</div>
            </div>
            <div className="bg-dark-900 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[10px]">EMERGENCY IRQS</div>
              <div className="text-base font-bold text-rose-400 mt-1">{intr.stats?.emergencyInterrupts || 0}</div>
            </div>
          </div>

          {/* Interrupt Vector Table (IVT) */}
          <div className="bg-dark-900 p-3 rounded-lg border border-slate-800 font-mono text-xs">
            <div className="text-[11px] font-bold text-slate-300 mb-2">INTERRUPT VECTOR TABLE (IVT)</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">0x0000: Power-On Reset Vector</span>
                <span className="text-cyan-300 font-bold">Target: 0x0020 (User Main)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-rose-400">0x0004: Emergency Vehicle Preemption</span>
                <span className="text-rose-300 font-bold">Target: 0x0200 (Emergency ISR)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">0x0008: Reserved (not implemented)</span>
                <span className="text-slate-400">No handler installed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Space Map */}
        <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm tracking-wide">
                MEMORY ADDRESS SPACE MAPPING (65,536-slot)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Von Neumann Architecture</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 rounded bg-dark-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-cyan-400">0x0000 – 0x001F</span>
                <span className="text-slate-300 ml-2">Interrupt Vector Table (IVT)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">System</span>
            </div>

            <div className="p-2.5 rounded bg-dark-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-400">0x0020 – 0x1FFF</span>
                <span className="text-slate-300 ml-2">Program / Instruction Code Memory</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Code</span>
            </div>

            <div className="p-2.5 rounded bg-dark-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-indigo-400">0x2000 – 0x7FFF</span>
                <span className="text-slate-300 ml-2">Data Memory & Variables</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Data</span>
            </div>

            <div className="p-2.5 rounded bg-dark-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-amber-400">0x8000 – 0x8FFF</span>
                <span className="text-slate-300 ml-2">CPU Hardware Call Stack (SP = 0x8FFF)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Stack</span>
            </div>

            <div className="p-2.5 rounded bg-dark-900 border border-rose-900/50 flex justify-between items-center">
              <div>
                <span className="font-bold text-rose-400">0xF000 – 0xF0FF</span>
                <span className="text-slate-300 ml-2">Memory-Mapped I/O (Sensors & Signals)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300">I/O Ports</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
