/**
 * TraceTable.jsx
 * Real-time CPU Execution Trace and Architectural History Table
 */

import React from 'react';
import { History, Terminal } from 'lucide-react';

export const TraceTable = ({ traceHistory }) => {
  const history = traceHistory || [];

  return (
    <div className="bg-dark-850 rounded-xl border border-slate-800 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            INSTRUCTION EXECUTION TRACE
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Showing last {history.length} instructions
        </span>
      </div>

      <div className="overflow-x-auto max-h-[360px]">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-dark-900 text-slate-400 text-[11px] sticky top-0 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">CLK</th>
              <th className="py-2.5 px-3">PC</th>
              <th className="py-2.5 px-3">INSTRUCTION</th>
              <th className="py-2.5 px-3">OPCODE</th>
              <th className="py-2.5 px-3">ALU</th>
              <th className="py-2.5 px-3">FLAGS (ZCNV)</th>
              <th className="py-2.5 px-3">REG DELTA</th>
              <th className="py-2.5 px-3">I/O OPERATION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {history.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-slate-400">
                  No instructions executed yet. Click "Single Step" or "Run CPU" to begin execution.
                </td>
              </tr>
            ) : (
              history.map((row, idx) => {
                const instr = row.instruction;
                const f = row.flags || {};
                const deltaKeys = Object.keys(row.registersDelta || {});
                const io = row.ioAccess;

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-400">{row.stepId}</td>
                    <td className="py-2 px-3 text-amber-300 font-bold">{row.cycle}</td>
                    <td className="py-2 px-3 text-cyan-300">
                      0x{row.pc.toString(16).toUpperCase().padStart(4, '0')}
                    </td>
                    <td className="py-2 px-3 text-slate-200 font-bold">
                      {instr ? `${instr.mnemonic} ${instr.op1 ?? ''} ${instr.op2 !== undefined ? ', ' + instr.op2 : ''}` : '---'}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      0x{(instr?.opcode ?? 0).toString(16).toUpperCase().padStart(2, '0')}
                    </td>
                    <td className="py-2 px-3 text-indigo-300">
                      {row.aluResult !== null ? row.aluResult : '-'}
                    </td>
                    <td className="py-2 px-3 font-semibold">
                      <span className={f.Z ? 'text-amber-400' : 'text-slate-600'}>Z</span>
                      <span className={f.C ? 'text-amber-400' : 'text-slate-600'}>C</span>
                      <span className={f.N ? 'text-amber-400' : 'text-slate-600'}>N</span>
                      <span className={f.V ? 'text-amber-400' : 'text-slate-600'}>V</span>
                    </td>
                    <td className="py-2 px-3 text-emerald-400">
                      {deltaKeys.length > 0 ? (
                        deltaKeys.map(k => `${k}: ${row.registersDelta[k].from}->${row.registersDelta[k].to}`).join(', ')
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {io ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          io.type === 'READ' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {io.type} [0x{io.port.toString(16).toUpperCase()}]: {io.value}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
