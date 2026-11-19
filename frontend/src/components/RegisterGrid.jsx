/**
 * RegisterGrid.jsx
 * Visual Register File & Architectural Flag Representation
 */

import React from 'react';
import { Cpu, ShieldAlert, Binary } from 'lucide-react';

export const RegisterGrid = ({ registers, lastTrace }) => {
  const regs = registers || {
    PC: 0x0020,
    IR: null,
    ACC: 0,
    R0: 0,
    R1: 0,
    R2: 0,
    R3: 0,
    SP: 0x8FFF,
    FLAGS: { Z: 0, C: 0, N: 0, V: 0 },
    CLOCK: 0
  };

  const changed = lastTrace?.registersDelta || {};

  const toHex = (val) => '0x' + (val ?? 0).toString(16).toUpperCase().padStart(4, '0');
  const toBin = (val) => (val ?? 0).toString(2).padStart(16, '0');

  const regCards = [
    { name: 'PC', role: 'Program Counter', val: regs.PC, isChanged: !!changed.PC, color: 'border-cyan-500/50' },
    { name: 'ACC', role: 'Accumulator', val: regs.ACC, isChanged: !!changed.ACC, color: 'border-indigo-500/50' },
    { name: 'R0', role: 'General Purpose (North Sensor)', val: regs.R0, isChanged: !!changed.R0, color: 'border-emerald-500/50' },
    { name: 'R1', role: 'General Purpose (South Sensor)', val: regs.R1, isChanged: !!changed.R1, color: 'border-emerald-500/50' },
    { name: 'R2', role: 'General Purpose (East Sensor)', val: regs.R2, isChanged: !!changed.R2, color: 'border-emerald-500/50' },
    { name: 'R3', role: 'General Purpose (West Sensor)', val: regs.R3, isChanged: !!changed.R3, color: 'border-emerald-500/50' },
    { name: 'SP', role: 'Stack Pointer', val: regs.SP, isChanged: !!changed.SP, color: 'border-amber-500/50' },
    { name: 'CLOCK', role: 'Master Clock Cycles', val: regs.CLOCK, isChanged: true, color: 'border-purple-500/50' },
  ];

  const flags = regs.FLAGS || { Z: 0, C: 0, N: 0, V: 0 };

  return (
    <div className="bg-dark-850 rounded-xl border border-slate-800 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">CPU REGISTER FILE</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">16-bit Architecture</span>
      </div>

      {/* Main Registers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {regCards.map((reg) => (
          <div
            key={reg.name}
            className={`bg-dark-900 rounded-lg p-3 border transition-all ${
              reg.isChanged ? `${reg.color} bg-cyan-950/20 shadow-md shadow-cyan-950/40` : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-bold text-sm text-cyan-400">{reg.name}</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[90px]">{reg.role}</span>
            </div>

            {/* Hexadecimal & Decimal Display */}
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base font-bold text-slate-100">{toHex(reg.val)}</span>
              <span className="text-xs text-slate-400 font-normal">({reg.val ?? 0})</span>
            </div>

            {/* Binary representation */}
            <div className="mt-2 text-[9px] font-mono text-slate-400 tracking-wider overflow-x-hidden select-all bg-dark-850 px-1.5 py-0.5 rounded border border-slate-800/80">
              {toBin(reg.val)}
            </div>
          </div>
        ))}
      </div>

      {/* Architectural Status Flags & IR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
        
        {/* Flags Panel */}
        <div className="bg-dark-900 p-3.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>STATUS FLAGS REGISTER</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">PSW / FLAGS</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            {[
              { key: 'Z', name: 'Zero', desc: 'Result is 0', active: flags.Z === 1 },
              { key: 'C', name: 'Carry', desc: 'Carry / Borrow', active: flags.C === 1 },
              { key: 'N', name: 'Negative', desc: 'MSB is 1', active: flags.N === 1 },
              { key: 'V', name: 'Overflow', desc: 'Signed Overflow', active: flags.V === 1 },
            ].map((f) => (
              <div
                key={f.key}
                className={`py-2 px-1 rounded border transition-all ${
                  f.active
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-dark-850 border-slate-800 text-slate-400'
                }`}
                title={f.desc}
              >
                <div className="text-xs font-bold">{f.key}</div>
                <div className="text-sm font-extrabold">{f.active ? '1' : '0'}</div>
                <div className="text-[9px] text-slate-400">{f.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Instruction Register (IR) Detail */}
        <div className="bg-dark-900 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Binary className="w-3.5 h-3.5 text-indigo-400" />
              <span>INSTRUCTION REGISTER (IR)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Current Latch</span>
          </div>

          <div className="bg-dark-850 p-2.5 rounded border border-slate-800/80 font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Mnemonic:</span>
              <span className="text-cyan-300 font-bold">{regs.IR?.mnemonic || 'NOP'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Opcode:</span>
              <span className="text-amber-300 font-bold">
                {regs.IR?.opcode ? '0x' + regs.IR.opcode.toString(16).toUpperCase().padStart(2, '0') : '0x00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Operands:</span>
              <span className="text-slate-200">
                {regs.IR ? `${regs.IR.op1 ?? ''}${regs.IR.op2 ? ', ' + regs.IR.op2 : ''}` : 'None'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
