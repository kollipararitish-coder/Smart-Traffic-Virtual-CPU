/**
 * OverviewPage.jsx
 * Unified Academic Dashboard & System Overview
 */

import React from 'react';
import { RegisterGrid } from '../components/RegisterGrid.jsx';
import { TrafficIntersectionView } from '../components/TrafficIntersectionView.jsx';
import { TraceTable } from '../components/TraceTable.jsx';
import { 
  Cpu, 
  Clock, 
  Activity, 
  Car, 
  AlertTriangle, 
  Compass, 
  ShieldCheck 
} from 'lucide-react';

export const OverviewPage = ({ 
  cpuState, 
  trafficState, 
  onSpawnVehicle, 
  onTriggerEmergency 
}) => {
  const counts = trafficState?.counts || { North: 0, South: 0, East: 0, West: 0 };
  const totalVehicles = counts.North + counts.South + counts.East + counts.West;
  const signals = trafficState?.signals || {};
  const activeGreen = Object.keys(signals).find(k => signals[k] === 2) || 'NONE';

  const kpis = [
    {
      title: 'CPU Status',
      val: cpuState?.state || 'PAUSED',
      icon: Cpu,
      color: cpuState?.state === 'RUNNING' ? 'text-emerald-400' : 'text-amber-400',
      sub: `Stage: ${cpuState?.currentStage || 'FETCH'}`
    },
    {
      title: 'Clock Cycles',
      val: cpuState?.registers?.CLOCK || 0,
      icon: Clock,
      color: 'text-cyan-400',
      sub: `${cpuState?.instructionCount || 0} Instructions`
    },
    {
      title: 'Active Green Signal',
      val: activeGreen.toUpperCase(),
      icon: Compass,
      color: activeGreen !== 'NONE' ? 'text-emerald-400' : 'text-slate-400',
      sub: 'Set via CPU I/O Bus'
    },
    {
      title: 'Intersection Queue',
      val: `${totalVehicles} Cars`,
      icon: Car,
      color: 'text-indigo-400',
      sub: `Passed: ${trafficState?.stats?.totalPassed || 0}`
    },
    {
      title: 'Emergency Priority',
      val: trafficState?.activeEmergency ? trafficState.activeEmergency.direction.toUpperCase() : 'CLEAR',
      icon: trafficState?.activeEmergency ? AlertTriangle : ShieldCheck,
      color: trafficState?.activeEmergency ? 'text-rose-400 animate-pulse' : 'text-emerald-400',
      sub: 'Hardware IRQ 0x0004'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-dark-850 p-4 rounded-xl border border-slate-800 shadow">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{kpi.title}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-xl font-bold font-mono ${kpi.color}`}>{kpi.val}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Traffic Intersection Visualizer */}
        <div className="lg:col-span-7">
          <TrafficIntersectionView
            trafficState={trafficState}
            onSpawnVehicle={onSpawnVehicle}
            onTriggerEmergency={onTriggerEmergency}
          />
        </div>

        {/* Right Column: Registers & CPU Hardware */}
        <div className="lg:col-span-5 space-y-6">
          <RegisterGrid
            registers={cpuState?.registers}
            lastTrace={cpuState?.recentTrace?.[0]}
          />
        </div>
      </div>

      {/* Bottom Section: Execution Trace Table */}
      <div>
        <TraceTable traceHistory={cpuState?.recentTrace} />
      </div>

    </div>
  );
};
