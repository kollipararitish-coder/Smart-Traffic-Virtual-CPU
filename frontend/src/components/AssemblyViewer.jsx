/**
 * AssemblyViewer.jsx
 * Professional Assembly Language Code Inspector, Line Number Gutter,
 * Live PC Pointer, Program Presets, and Assembler Loader
 */

import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Upload, RefreshCw, CheckCircle, AlertCircle, Copy, Play } from 'lucide-react';

export const AssemblyViewer = ({ programSource, cpuState, onLoadProgram }) => {
  const [code, setCode] = useState(programSource || '');
  const [statusMsg, setStatusMsg] = useState(null);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Synchronize when programSource prop arrives from backend
  useEffect(() => {
    if (programSource && (!code || code.trim() === '')) {
      setCode(programSource);
    }
  }, [programSource]);

  // Sync scrolling between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const pc = cpuState?.registers?.PC ?? 0x20;

  const handleAssemble = async () => {
    try {
      setStatusMsg(null);
      await onLoadProgram(code);
      setStatusMsg({ type: 'success', text: 'Program successfully assembled and loaded into CPU memory!' });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Assembly Error' });
    }
  };

  const handleResetToDefault = () => {
    if (programSource) {
      setCode(programSource);
      setStatusMsg({ type: 'success', text: 'Reset code to default simulation program.' });
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  const lineCount = (code || '').split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

  return (
    <div className="bg-dark-850 rounded-xl border border-slate-800 p-5 shadow-lg flex flex-col">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <FileCode className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              TRAFFIC CONTROL ASSEMBLY PROGRAM
            </h3>
            <p className="text-[11px] text-slate-400">
              Instruction-level assembly source code executed directly by the Virtual CPU
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToDefault}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
            title="Reload default program source"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleAssemble}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition active:scale-95"
            title="Assemble source code and load into CPU Instruction Memory"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Assemble &amp; Load</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div className={`mb-3 p-3 rounded-lg text-xs font-mono flex items-center space-x-2.5 ${statusMsg.type === 'success'
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
          }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Editor Container with Fixed Line-Number Gutter & Textarea */}
      <div className="relative rounded-lg border border-slate-800 bg-[#0b1019] overflow-hidden flex" style={{ height: '520px' }}>
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 bg-[#080c14] border-r border-slate-800 select-none text-right pr-2 text-slate-600 font-mono text-xs leading-6 overflow-hidden"
        >
          {lineNumbers.map((num) => (
            <div key={num} className="h-6">
              {num}
            </div>
          ))}
        </div>

        {/* Code Textarea */}
        <div className="flex-1 h-full overflow-hidden relative">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={handleScroll}
            spellCheck="false"
            className="w-full h-full bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-6 p-3 selection:bg-cyan-500/30 whitespace-pre"
            placeholder="; Enter or load assembly code here..."
            style={{
              tabSize: 2,
              lineHeight: '24px',
            }}
          />
        </div>
      </div>

      {/* Footer Metrics & Status Bar */}
      <div className="mt-3 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="text-slate-500">Active PC:</span>
            <span className="text-amber-400 font-bold">0x{pc.toString(16).toUpperCase().padStart(4, '0')}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Lines: {lineCount}</span>
        </div>

        <div className="text-slate-500 text-[10px]">
          ISA: LOAD, MOV, ADD, SUB, CMP, JGT, JZ, JMP, IN, OUT, WAIT, IRQ, IRET
        </div>
      </div>
    </div>
  );
};
