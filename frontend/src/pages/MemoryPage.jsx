/**
 * MemoryPage.jsx
 * Unified 65,536-slot Memory Inspector and Memory-Mapped I/O Diagnostics
 */

import React, { useState, useEffect } from 'react';
import { Database, Search, Cpu } from 'lucide-react';
import { api } from '../services/api.js';

export const MemoryPage = ({ cpuState }) => {
  const [rangeStart, setRangeStart] = useState(0x0020);
  const [memoryDump, setMemoryDump] = useState([]);

  const ioMap = cpuState?.ioState || {};

  useEffect(() => {
    api.getMemory(rangeStart, 32).then(data => {
      setMemoryDump(data.memory || []);
    }).catch(err => console.error(err));
  }, [rangeStart, cpuState?.registers?.CLOCK]);

  const ioRegisters = [
    { port: 0xF000, name: 'NORTH_COUNT', type: 'Sensor (Read)', desc: 'North approach vehicle queue length', val: ioMap[0xF000] ?? 0 },
    { port: 0xF001, name: 'SOUTH_COUNT', type: 'Sensor (Read)', desc: 'South approach vehicle queue length', val: ioMap[0xF001] ?? 0 },
    { port: 0xF002, name: 'EAST_COUNT',  type: 'Sensor (Read)', desc: 'East approach vehicle queue length', val: ioMap[0xF002] ?? 0 },
    { port: 0xF003, name: 'WEST_COUNT',  type: 'Sensor (Read)', desc: 'West approach vehicle queue length', val: ioMap[0xF003] ?? 0 },
    { port: 0xF010, name: 'NORTH_SIGNAL', type: 'Actuator (Write)', desc: 'North Signal Light (0=Red, 1=Yellow, 2=Green)', val: ioMap[0xF010] ?? 0 },
    { port: 0xF011, name: 'SOUTH_SIGNAL', type: 'Actuator (Write)', desc: 'South Signal Light (0=Red, 1=Yellow, 2=Green)', val: ioMap[0xF011] ?? 0 },
    { port: 0xF012, name: 'EAST_SIGNAL',  type: 'Actuator (Write)', desc: 'East Signal Light (0=Red, 1=Yellow, 2=Green)', val: ioMap[0xF012] ?? 0 },
    { port: 0xF013, name: 'WEST_SIGNAL',  type: 'Actuator (Write)', desc: 'West Signal Light (0=Red, 1=Yellow, 2=Green)', val: ioMap[0xF013] ?? 0 },
    { port: 0xF020, name: 'EMERGENCY_STATUS', type: 'Status (Read)', desc: 'Active Emergency Lane (0=None, 1=N, 2=S, 3=E, 4=W)', val: ioMap[0xF020] ?? 0 },
    { port: 0xF021, name: 'EMERGENCY_ACK',    type: 'Control (Write)', desc: 'Write 1 to clear emergency preemption interrupt', val: ioMap[0xF021] ?? 0 },
    { port: 0xF030, name: 'SYS_TICK',         type: 'Timer (Read)', desc: 'Hardware system tick reference', val: ioMap[0xF030] ?? 0 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Memory-Mapped I/O Table */}
      <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              MEMORY-MAPPED I/O REGISTERS (0xF000 – 0xF0FF)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Direct Hardware Interface</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-dark-900 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">PORT ADDRESS</th>
                <th className="py-2.5 px-3">IDENTIFIER</th>
                <th className="py-2.5 px-3">I/O TYPE</th>
                <th className="py-2.5 px-3">CURRENT VALUE</th>
                <th className="py-2.5 px-3">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ioRegisters.map((reg) => (
                <tr key={reg.port} className="hover:bg-slate-800/40 transition">
                  <td className="py-2 px-3 text-cyan-300 font-bold">
                    0x{reg.port.toString(16).toUpperCase()}
                  </td>
                  <td className="py-2 px-3 text-slate-200 font-bold">{reg.name}</td>
                  <td className="py-2 px-3 text-amber-300">{reg.type}</td>
                  <td className="py-2 px-3 text-emerald-400 font-extrabold text-sm">{reg.val}</td>
                  <td className="py-2 px-3 text-slate-400">{reg.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* General Memory Explorer */}
      <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex flex-wrap items-center justify-between mb-4 border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              65,536-slot UNIFIED RAM & INSTRUCTION MEMORY DUMP
            </h3>
          </div>

          {/* Quick Jumps */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-400 text-[11px]">Jump to:</span>
            {[
              { label: 'IVT (0x0000)', addr: 0x0000 },
              { label: 'Code (0x0020)', addr: 0x0020 },
              { label: 'ISR (0x0200)', addr: 0x0200 },
              { label: 'Stack (0x8FE0)', addr: 0x8FE0 },
            ].map(j => (
              <button
                key={j.addr}
                onClick={() => setRangeStart(j.addr)}
                className={`px-2 py-1 rounded text-[11px] border transition ${
                  rangeStart === j.addr ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-dark-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {j.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[360px]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-dark-900 text-slate-400 text-[11px] sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">ADDRESS</th>
                <th className="py-2.5 px-3">DECIMAL</th>
                <th className="py-2.5 px-3">RAW / DECODED VALUE</th>
                <th className="py-2.5 px-3">ACTIVE PC POINTER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {memoryDump.map((cell) => {
                const isPc = cpuState?.registers?.PC === cell.address;
                const isObj = typeof cell.value === 'object' && cell.value !== null;
                const displayVal = isObj
                  ? `${cell.value.mnemonic} ${cell.value.op1 ?? ''} ${cell.value.op2 !== undefined ? ', ' + cell.value.op2 : ''}`
                  : `0x${(cell.value || 0).toString(16).toUpperCase().padStart(4, '0')} (${cell.value || 0})`;

                return (
                  <tr key={cell.address} className={`hover:bg-slate-800/40 transition ${isPc ? 'bg-cyan-950/30' : ''}`}>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{cell.hexAddress}</td>
                    <td className="py-2 px-3 text-slate-400">{cell.address}</td>
                    <td className={`py-2 px-3 font-semibold ${isObj ? 'text-amber-300' : 'text-slate-200'}`}>
                      {displayVal}
                    </td>
                    <td className="py-2 px-3">
                      {isPc && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/30 text-cyan-300 border border-cyan-400 text-[10px] font-bold animate-pulse">
                          {'PC -> NEXT FETCH'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
