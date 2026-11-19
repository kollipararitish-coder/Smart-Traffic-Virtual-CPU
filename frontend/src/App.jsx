/**
 * App.jsx
 * Master Frontend Controller & Real-Time State Hub
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { ControlToolbar } from './components/ControlToolbar.jsx';
import { OverviewPage } from './pages/OverviewPage.jsx';
import { ArchitecturePage } from './pages/ArchitecturePage.jsx';
import { ExecutionPage } from './pages/ExecutionPage.jsx';
import { DatapathPage } from './pages/DatapathPage.jsx';
import { IntersectionPage } from './pages/IntersectionPage.jsx';
import { MemoryPage } from './pages/MemoryPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { api } from './services/api.js';
import { socket } from './services/socket.js';

export function App() {
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [cpuState, setCpuState] = useState(null);
  const [trafficState, setTrafficState] = useState(null);
  const [programSource, setProgramSource] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Sync initial state and connect socket events
  useEffect(() => {
    // 1. REST initial fetch
    api.getState()
      .then((data) => {
        setCpuState(data.cpu);
        setTrafficState(data.traffic);
        setProgramSource(data.programSource);
      })
      .catch((err) => setError(err.message));

    // 2. Socket.IO events
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('request_state');
    });

    socket.on('connect_error', (err) => setError(`Connection failed: ${err.message}`));
    socket.on('simulation_error', (data) => setError(data.message));
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('initial_state', (data) => {
      setError('');
      if (data?.cpu) setCpuState(data.cpu);
      if (data?.traffic) setTrafficState(data.traffic);
      if (data?.programSource) setProgramSource(data.programSource);
    });

    socket.on('state_update', (data) => {
      if (data?.cpu) setCpuState(data.cpu);
      if (data?.traffic) setTrafficState(data.traffic);
    });

    socket.on('cpu_state', (data) => {
      setCpuState(data);
    });

    socket.on('traffic_state', (data) => {
      setTrafficState(data);
    });

    socket.on('step_executed', (data) => {
      if (data?.cpu) setCpuState(data.cpu);
      if (data?.traffic) setTrafficState(data.traffic);
    });

    socket.on('simulation_reset', (data) => {
      setError('');
      if (data?.cpu) setCpuState(data.cpu);
      if (data?.traffic) setTrafficState(data.traffic);
    });

    socket.on('program_loaded', (data) => {
      if (data?.cpu) setCpuState(data.cpu);
      if (data?.traffic) setTrafficState(data.traffic);
      if (data?.programSource) setProgramSource(data.programSource);
    });

    socket.on('emergency_triggered', (data) => {
      if (data?.cpu) setCpuState(data.cpu);
      if (data?.traffic) setTrafficState(data.traffic);
    });

    socket.connect();
    return () => {
      socket.disconnect();
      socket.off('connect_error');
      socket.off('simulation_error');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initial_state');
      socket.off('state_update');
      socket.off('cpu_state');
      socket.off('traffic_state');
      socket.off('step_executed');
      socket.off('simulation_reset');
      socket.off('program_loaded');
      socket.off('emergency_triggered');
    };
  }, []);

  // Action Handlers
  const handleStep = async () => {
    setError('');
    try {
      const res = await api.step();
      if (res?.cpu) setCpuState(res.cpu);
      if (res?.traffic) setTrafficState(res.traffic);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRun = async () => {
    setError('');
    try {
      await api.start();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePause = async () => {
    setError('');
    try {
      await api.pause();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = async () => {
    setError('');
    try {
      const res = await api.reset();
      if (res?.state?.cpu) setCpuState(res.state.cpu);
      if (res?.state?.traffic) setTrafficState(res.state.traffic);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetSpeed = async (speedMs) => {
    setError('');
    setCpuState((prev) => (prev ? { ...prev, clockSpeedMs: speedMs } : prev));
    try {
      await api.setSpeed(speedMs);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTriggerEmergency = async (direction) => {
    setError('');
    try {
      await api.triggerEmergency(direction);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSpawnVehicle = async (direction, type = 'car', count = 1) => {
    setError('');
    try {
      await api.spawnVehicle(direction, type, count);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetSpawnRate = async (direction, rate) => {
    setError('');
    try {
      await api.setSpawnRate(direction, rate);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoadProgram = async (source) => {
    const res = await api.loadProgram(source);
    setProgramSource(source);
    return res;
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col text-slate-100">
      
      {/* Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cpuState={cpuState}
        trafficState={trafficState}
        isConnected={isConnected}
      />

      {(error || cpuState?.lastError) && (
        <div role="alert" className="mx-4 my-3 rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200">
          {error || cpuState.lastError}
          <button className="ml-4 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      {/* Unified Simulation Toolbar */}
      <ControlToolbar
        cpuState={cpuState}
        onStep={handleStep}
        onRun={handleRun}
        onPause={handlePause}
        onReset={handleReset}
        onSetSpeed={handleSetSpeed}
        onTriggerEmergency={handleTriggerEmergency}
      />

      {/* Main Tabbed Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <OverviewPage
            cpuState={cpuState}
            trafficState={trafficState}
            onSpawnVehicle={handleSpawnVehicle}
            onTriggerEmergency={handleTriggerEmergency}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitecturePage cpuState={cpuState} />
        )}

        {activeTab === 'execution' && (
          <ExecutionPage
            programSource={programSource}
            cpuState={cpuState}
            onLoadProgram={handleLoadProgram}
          />
        )}

        {activeTab === 'datapath' && (
          <DatapathPage cpuState={cpuState} />
        )}

        {activeTab === 'intersection' && (
          <IntersectionPage
            trafficState={trafficState}
            onSpawnVehicle={handleSpawnVehicle}
            onTriggerEmergency={handleTriggerEmergency}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryPage cpuState={cpuState} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            cpuState={cpuState}
            trafficState={trafficState}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            cpuState={cpuState}
            trafficState={trafficState}
            onSetSpeed={handleSetSpeed}
            onSetSpawnRate={handleSetSpawnRate}
          />
        )}
      </main>

      {/* Engineering Footer */}
      <footer className="bg-dark-850 border-t border-slate-800 py-4 px-6 text-xs text-slate-400 font-mono text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU</span>
          <span>Computer Organization & Architecture (COA) Academic Engineering Project</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
