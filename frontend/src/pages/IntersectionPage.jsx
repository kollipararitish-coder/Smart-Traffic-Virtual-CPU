/**
 * IntersectionPage.jsx
 * Dedicated Traffic Intersection View with Advanced Approach Controls
 */

import React from 'react';
import { TrafficIntersectionView } from '../components/TrafficIntersectionView.jsx';
import { Layers, Plus, Siren, Car, Truck, Bus } from 'lucide-react';

export const IntersectionPage = ({ 
  trafficState, 
  onSpawnVehicle, 
  onTriggerEmergency 
}) => {
  const directions = ['North', 'South', 'East', 'West'];
  const counts = trafficState?.counts || {};
  const signals = trafficState?.signals || {};

  const signalLabels = {
    0: { text: 'RED', color: 'text-rose-400 bg-rose-500/20 border-rose-500/40' },
    1: { text: 'YELLOW', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' },
    2: { text: 'GREEN', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' }
  };

  return (
    <div className="space-y-6">
      
      {/* Main Intersection */}
      <TrafficIntersectionView
        trafficState={trafficState}
        onSpawnVehicle={onSpawnVehicle}
        onTriggerEmergency={onTriggerEmergency}
      />

      {/* Advanced Approach Control & Vehicle Dispatchers */}
      <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center space-x-2 mb-4 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            APPROACH LANE INJECTION & STATUS CONTROLS
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {directions.map((dir) => {
            const sig = signals[dir] ?? 0;
            const badge = signalLabels[sig] || signalLabels[0];

            return (
              <div key={dir} className="bg-dark-900 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 text-sm">{dir} Lane</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400 text-xs">
                  <span>Vehicles in Queue:</span>
                  <span className="text-cyan-300 font-bold">{counts[dir] || 0}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] text-slate-400">Inject Specific Vehicle:</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => onSpawnVehicle(dir, 'car', 1)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center space-x-1 transition"
                    >
                      <Car className="w-3 h-3 text-cyan-400" />
                      <span>Car</span>
                    </button>
                    <button
                      onClick={() => onSpawnVehicle(dir, 'bus', 1)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center space-x-1 transition"
                    >
                      <Bus className="w-3 h-3 text-indigo-400" />
                      <span>Bus</span>
                    </button>
                    <button
                      onClick={() => onSpawnVehicle(dir, 'truck', 1)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center justify-center space-x-1 transition"
                    >
                      <Truck className="w-3 h-3 text-amber-400" />
                      <span>Truck</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onTriggerEmergency(dir)}
                    className="w-full mt-2 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <Siren className="w-3.5 h-3.5 text-rose-400" />
                    <span>Trigger Emergency Ambulance</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
