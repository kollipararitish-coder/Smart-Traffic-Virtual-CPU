/**
 * TrafficIntersectionView.jsx
 * Four-Way Intersection Visualization & Actuator Simulation
 * Embeds High-Resolution 680x680 Canvas with Cyber-Physical Controls
 */

import React from 'react';
import { IntersectionCanvas } from './IntersectionCanvas.jsx';
import { 
  PlusCircle, 
  Siren, 
  Car, 
  Bus, 
  Truck, 
  Activity, 
  Radio 
} from 'lucide-react';

export const TrafficIntersectionView = ({ 
  trafficState, 
  onSpawnVehicle, 
  onTriggerEmergency 
}) => {
  const counts = trafficState?.counts || { North: 0, South: 0, East: 0, West: 0 };
  const activeEmergency = trafficState?.activeEmergency;
  const currentPhase = (trafficState?.currentPhase || 'ALL_RED_CLEARANCE').replace(/_/g, ' ');

  return (
    <div className="bg-dark-850 rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              FOUR-WAY INTERSECTION HARDWARE SIMULATION
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sensors: 0xF000–0xF003 | Actuators: 0xF010–0xF013 | Preemption: 0xF020
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeEmergency ? (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/50 text-xs font-mono font-bold animate-pulse">
              <Siren className="w-4 h-4 text-rose-400" />
              <span>EMERGENCY IRQ: {activeEmergency.direction.toUpperCase()}</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded bg-slate-800/80 text-cyan-300 border border-slate-700 text-xs font-mono">
              PHASE: <strong className="text-white">{currentPhase}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Main 680x680 Canvas Component */}
      <div className="flex justify-center">
        <IntersectionCanvas trafficState={trafficState} />
      </div>

      {/* Manual Vehicle Injection Controls */}
      <div className="pt-2 border-t border-slate-800">
        <div className="text-xs font-mono text-slate-400 mb-2">MANUAL VEHICLE DISPATCH & QUEUE SENSORS:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {['North', 'South', 'East', 'West'].map(dir => (
            <div key={dir} className="bg-dark-900 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-200">{dir}</span>
                <span className="text-xs text-amber-300 font-extrabold bg-dark-850 px-2 py-0.5 rounded border border-slate-800">
                  {counts[dir]} veh
                </span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  onClick={() => onSpawnVehicle(dir, 'CAR', 1)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center space-x-0.5 transition"
                  title={`Spawn car on ${dir}`}
                >
                  <Car className="w-3 h-3 text-cyan-400" />
                  <span>Car</span>
                </button>
                <button
                  onClick={() => onSpawnVehicle(dir, 'BUS', 1)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center space-x-0.5 transition"
                  title={`Spawn bus on ${dir}`}
                >
                  <Bus className="w-3 h-3 text-amber-400" />
                  <span>Bus</span>
                </button>
                <button
                  onClick={() => onSpawnVehicle(dir, 'TRUCK', 1)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center space-x-0.5 transition"
                  title={`Spawn truck on ${dir}`}
                >
                  <Truck className="w-3 h-3 text-indigo-400" />
                  <span>Truck</span>
                </button>
              </div>

              <button
                onClick={() => onTriggerEmergency(dir)}
                className="w-full py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center justify-center space-x-1 transition active:scale-95"
                title={`Inject Emergency Ambulance on ${dir}`}
              >
                <Siren className="w-3 h-3 text-rose-400" />
                <span>Ambulance IRQ</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
