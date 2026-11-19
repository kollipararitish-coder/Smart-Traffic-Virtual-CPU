/**
 * AnalyticsPage.jsx
 * Real Historical Analytics & Performance Metrics powered by SQLite
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { BarChart3, TrendingUp, Clock, Cpu, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';

export const AnalyticsPage = ({ cpuState, trafficState }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = () => {
    setLoading(true);
    api.getAnalytics()
      .then(data => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analytics:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(interval);
  }, []);

  const freqData = (analytics?.instructionFrequency || []).map(item => ({
    name: item.mnemonic,
    count: item.count
  }));

  const historyData = (analytics?.trafficHistory || []).map((item, idx) => ({
    time: idx + 1,
    North: item.north_count,
    South: item.south_count,
    East: item.east_count,
    West: item.west_count,
    Throughput: item.throughput
  }));

  const session = analytics?.session || {};

  return (
    <div className="space-y-6">
      
      {/* Session Metadata Banner */}
      <div className="bg-dark-850 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="text-slate-400 text-[10px]">SQLITE ACTIVE SESSION:</div>
            <div className="text-sm font-bold text-slate-100">
              Session #{session.id || 1} &bull; Started {session.start_time ? new Date(session.start_time).toLocaleTimeString() : 'Recently'}
            </div>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Two Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Instruction Frequency Bar Chart */}
        <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              CPU INSTRUCTION FREQUENCY DISTRIBUTION
            </h3>
            <span className="text-[11px] font-mono text-slate-400">ISA Workload</span>
          </div>

          <div className="h-64">
            {freqData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={freqData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                Awaiting CPU instruction executions...
              </div>
            )}
          </div>
        </div>

        {/* Traffic Throughput & Queues Area Chart */}
        <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              TRAFFIC FLOW & QUEUE DYNAMICS OVER TIME
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Intersection Metrics</span>
          </div>

          <div className="h-64">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="North" stackId="1" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="South" stackId="1" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="East" stackId="1" stroke="#34d399" fill="#34d399" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="West" stackId="1" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                Gathering traffic dynamics from simulation loop...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Emergency Events Log from Database */}
      <div className="bg-dark-850 p-5 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">
            RECORDED EMERGENCY INTERRUPT EVENTS (SQLITE TABLE: emergency_events)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Hardware Preemption Audit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-dark-900 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">EVENT ID</th>
                <th className="py-2.5 px-3">APPROACH DIRECTION</th>
                <th className="py-2.5 px-3">TRIGGER TIMESTAMP</th>
                <th className="py-2.5 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(!analytics?.emergencyEvents || analytics.emergencyEvents.length === 0) ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-slate-400">
                    No emergency interrupt events logged yet.
                  </td>
                </tr>
              ) : (
                analytics.emergencyEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-cyan-300">#{ev.id}</td>
                    <td className="py-2 px-3 text-rose-400 font-bold">{ev.direction.toUpperCase()}</td>
                    <td className="py-2 px-3 text-slate-300">{new Date(ev.trigger_time).toLocaleTimeString()}</td>
                    <td className="py-2 px-3 text-emerald-400 font-semibold">{ev.clear_time ? 'COMPLETED' : session.status === 'COMPLETED' ? 'INTERRUPTED' : 'PENDING'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
