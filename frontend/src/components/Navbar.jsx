/**
 * Navbar.jsx
 * Engineering Navigation Header with Real-time Status Badges
 */

import React from 'react';
import { 
  Cpu, 
  Activity, 
  Layers, 
  PlaySquare, 
  GitBranch, 
  Database, 
  BarChart3, 
  Settings, 
  Clock, 
  Zap, 
  AlertTriangle 
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, cpuState, trafficState, isConnected }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'architecture', label: 'CPU Architecture', icon: Cpu },
    { id: 'execution', label: 'Instruction Execution', icon: PlaySquare },
    { id: 'datapath', label: 'Datapath', icon: GitBranch },
    { id: 'intersection', label: 'Traffic Intersection', icon: Layers },
    { id: 'memory', label: 'Memory & I/O', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stateColors = {
    RUNNING: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse',
    PAUSED: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    HALTED: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    WAITING: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
  };

  const status = cpuState?.state || 'PAUSED';

  return (
    <header className="bg-dark-850 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Academic Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base tracking-wide">SMART TRAFFIC VIRTUAL CPU</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  COA v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Instruction-Level Virtual CPU & 4-Way Traffic Controller</p>
            </div>
          </div>

          {/* Real-time Hardware Telemetry Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
            {/* Live Status Pill */}
            <div className={`px-2.5 py-1 rounded-md border flex items-center space-x-1.5 ${stateColors[status] || stateColors.PAUSED}`}>
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span className="font-semibold">{status}</span>
            </div>

            {/* Stage Pill */}
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 text-slate-300 flex items-center space-x-1.5">
              <span className="text-slate-400">STAGE:</span>
              <span className="text-cyan-400 font-bold">{cpuState?.currentStage || 'FETCH'}</span>
            </div>

            {/* Clock Cycles */}
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 text-slate-300 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">CLK:</span>
              <span className="text-amber-300 font-bold">{cpuState?.registers?.CLOCK || 0}</span>
            </div>

            {/* Instruction Count */}
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 text-slate-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">INSTR:</span>
              <span className="text-indigo-300 font-bold">{cpuState?.instructionCount || 0}</span>
            </div>

            {/* Emergency Indicator */}
            {trafficState?.activeEmergency && (
              <div className="bg-rose-500/20 px-2.5 py-1 rounded-md border border-rose-500/50 text-rose-300 flex items-center space-x-1 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-bold">IRQ: {trafficState.activeEmergency.direction.toUpperCase()}</span>
              </div>
            )}

            {/* Socket connection indicator */}
            <div className="flex items-center space-x-1 text-slate-400 pl-1" title={isConnected ? 'Backend Connected' : 'Disconnected'}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-1 border-t border-slate-800/80 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
