/**
 * SettingsPage.jsx
 * Simulation Configuration & Parameter Calibration
 */

import React from 'react';
import { Settings, Gauge, Sliders, Database, Check } from 'lucide-react';

export const SettingsPage = ({ 
  cpuState, 
  trafficState, 
  onSetSpeed, 
  onSetSpawnRate 
}) => {
  const speedMs = cpuState?.clockSpeedMs || 100;
  const spawnRates = trafficState?.spawnRates || { North: 0.35, South: 0.3, East: 0.25, West: 0.2 };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Execution Speed Config */}
      <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-3">
          <Gauge className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            CPU CLOCK SPEED & EXECUTION TIMING
          </h3>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Clock Tick Delay (ms per instruction cycle):</span>
            <span className="text-cyan-400 font-bold text-sm">{speedMs} ms</span>
          </div>

          <input
            type="range"
            min="20"
            max="1000"
            step="20"
            value={speedMs}
            onChange={(e) => onSetSpeed(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Fast (20ms - Max Throughput)</span>
            <span>Balanced (100ms)</span>
            <span>Slow-Motion Demonstration (1000ms)</span>
          </div>
        </div>
      </div>

      {/* Vehicle Spawn Rates */}
      <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            TRAFFIC GENERATION PROBABILITIES (VEHICLES / TICK)
          </h3>
        </div>

        <div className="space-y-4 font-mono text-xs">
          {['North', 'South', 'East', 'West'].map((dir) => (
            <div key={dir} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">{dir} Approach Arrival Rate:</span>
                <span className="text-emerald-400 font-bold">
                  {((spawnRates[dir] ?? 0.3) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={spawnRates[dir] ?? 0.3}
                onChange={(e) => onSetSpawnRate(dir, parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Database & System Info */}
      <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg font-mono text-xs space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Database className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            SYSTEM ARCHITECTURE SPECIFICATION
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="p-2.5 rounded bg-dark-900 border border-slate-800">
            <span className="text-slate-400">Architecture:</span>
            <div className="text-slate-100 font-bold mt-0.5">16-bit Educational Virtual CPU</div>
          </div>
          <div className="p-2.5 rounded bg-dark-900 border border-slate-800">
            <span className="text-slate-400">Instruction Stages:</span>
            <div className="text-slate-100 font-bold mt-0.5">Fetch, Decode, Exec, Mem, Writeback</div>
          </div>
          <div className="p-2.5 rounded bg-dark-900 border border-slate-800">
            <span className="text-slate-400">Database Engine:</span>
            <div className="text-slate-100 font-bold mt-0.5">SQLite (Node.js Native DatabaseSync)</div>
          </div>
          <div className="p-2.5 rounded bg-dark-900 border border-slate-800">
            <span className="text-slate-400">Real-time Transport:</span>
            <div className="text-slate-100 font-bold mt-0.5">WebSocket via Socket.IO</div>
          </div>
        </div>
      </div>

    </div>
  );
};
