/**
 * TrafficController.js
 * High-Fidelity Cyber-Physical 4-Way Traffic Simulation
 * Directly interfaced to Virtual CPU via Memory-Mapped I/O.
 * Features realistic vehicle physics, distance-from-stopline tracking,
 * smooth cross-intersection traversal, and emergency preemption.
 */

import { IO_MAP } from '../cpu/Memory.js';

const vehicleLength = v => ({CAR:38, BUS:56, TRUCK:50, MOTORCYCLE:24, AMBULANCE:42}[v?.type?.toUpperCase()] || 38);
const spacing = (leader, follower) => (vehicleLength(leader) + vehicleLength(follower)) / 2 + 4;

export class TrafficController {
  constructor(cpu) {
    this.cpu = cpu;
    this.directions = ['North', 'South', 'East', 'West'];
    this.reset();
    this.bindToCPU();
    this.seedInitialQueues();
  }

  reset() {
    this.signals = {
      North: 0, // 0 = RED, 1 = YELLOW, 2 = GREEN
      South: 0,
      East: 0,
      West: 0
    };

    this.lanes = {
      NORTH: { queue: [], light: 'RED', throughput: 0 },
      SOUTH: { queue: [], light: 'RED', throughput: 0 },
      EAST:  { queue: [], light: 'RED', throughput: 0 },
      WEST:  { queue: [], light: 'RED', throughput: 0 }
    };

    this.queues = {};
    for (const dir of this.directions) {
      Object.defineProperty(this.queues, dir, {
        enumerable: true,
        get: () => this.lanes[dir.toUpperCase()].queue,
        set: (queue) => {
          const previous = this.lanes[dir.toUpperCase()].queue;
          this.vehicles = this.vehicles.filter(v => !previous.includes(v));
          queue.forEach((v, i) => {
            v.distanceFromStopLine ??= i * 42;
            v.speed ??= 4;
            v.waitingTime ??= 0;
            v.direction = dir.toUpperCase();
            v.hasCrossed ??= false;
          });
          this.lanes[dir.toUpperCase()].queue = queue;
          this.vehicles.push(...queue);
        }
      });
    }

    this.vehicles = [];
    this.vehicleIdCounter = 1;
    this.simulationTime = 0;
    this.completedWait = 0;
    this.activeEmergency = null; // { direction, startTime, cleared: false }

    this.spawnRates = {
      North: 0.35,
      South: 0.30,
      East: 0.25,
      West: 0.20
    };

    this.stats = {
      totalSpawned: 0,
      totalPassed: 0,
      totalWaitTimeSeconds: 0,
      avgWaitTime: 0,
      passedPerDirection: { North: 0, South: 0, East: 0, West: 0 },
      emergencyCount: 0,
      currentPhase: 'ALL_RED_CLEARANCE'
    };
  }

  seedInitialQueues() {
    this.spawnVehicle('North', 'CAR', 4);
    this.spawnVehicle('South', 'CAR', 3);
    this.spawnVehicle('East', 'BUS', 5);
    this.spawnVehicle('West', 'CAR', 2);
  }

  bindToCPU() {
    const mem = this.cpu.memory;

    // Connect Sensor inputs: CPU reading 0xF000 - 0xF003 reads actual vehicle counts
    mem.setIOReadHandler(IO_MAP.NORTH_COUNT, () => this.lanes.NORTH.queue.length);
    mem.setIOReadHandler(IO_MAP.SOUTH_COUNT, () => this.lanes.SOUTH.queue.length);
    mem.setIOReadHandler(IO_MAP.EAST_COUNT,  () => this.lanes.EAST.queue.length);
    mem.setIOReadHandler(IO_MAP.WEST_COUNT,  () => this.lanes.WEST.queue.length);

    // Connect Actuators: CPU writing 0xF010 - 0xF013 updates traffic lights
    const syncLight = (dir, val) => {
      if (![0, 1, 2].includes(val)) throw new Error('Signal must be 0, 1 or 2');
      if (val !== 0 && this.directions.some(other => other !== dir && this.signals[other] !== 0)) {
        throw new Error('Conflicting traffic signals rejected by interlock');
      }
      this.signals[dir] = val;
      const upper = dir.toUpperCase();
      this.lanes[upper].light = val === 2 ? 'GREEN' : val === 1 ? 'YELLOW' : 'RED';
      this.updateCurrentPhase();
    };

    mem.setIOWriteHandler(IO_MAP.NORTH_SIGNAL, (val) => syncLight('North', val));
    mem.setIOWriteHandler(IO_MAP.SOUTH_SIGNAL, (val) => syncLight('South', val));
    mem.setIOWriteHandler(IO_MAP.EAST_SIGNAL,  (val) => syncLight('East', val));
    mem.setIOWriteHandler(IO_MAP.WEST_SIGNAL,  (val) => syncLight('West', val));

    // Connect Emergency status reading & clearing
    mem.setIOReadHandler(IO_MAP.EMERGENCY_STATUS, () => {
      if (!this.activeEmergency) return 0;
      switch (this.activeEmergency.direction) {
        case 'North': return 1;
        case 'South': return 2;
        case 'East':  return 3;
        case 'West':  return 4;
        default: return 0;
      }
    });

    mem.setIOWriteHandler(IO_MAP.EMERGENCY_ACK, (val) => {
      if (val === 1 && this.activeEmergency) {
        this.clearEmergency();
      }
    });
  }

  updateCurrentPhase() {
    if (this.signals.North === 2 || this.signals.South === 2) {
      this.stats.currentPhase = 'NORTH_SOUTH_GREEN';
    } else if (this.signals.North === 1 || this.signals.South === 1) {
      this.stats.currentPhase = 'NORTH_SOUTH_YELLOW';
    } else if (this.signals.East === 2 || this.signals.West === 2) {
      this.stats.currentPhase = 'EAST_WEST_GREEN';
    } else if (this.signals.East === 1 || this.signals.West === 1) {
      this.stats.currentPhase = 'EAST_WEST_YELLOW';
    } else {
      this.stats.currentPhase = 'ALL_RED_CLEARANCE';
    }
  }

  spawnVehicle(direction = null, type = null, count = 1) {
    const dirs = ['North', 'South', 'East', 'West'];
    if (direction !== null && !dirs.includes(direction)) throw new Error('Invalid direction');
    if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error('count must be an integer from 1 to 100');
    if (type !== null && (typeof type !== 'string' || !['CAR','BUS','TRUCK','MOTORCYCLE','AMBULANCE'].includes(type.toUpperCase()))) throw new Error('Invalid vehicle type');
    let lastCar = null;

    for (let c = 0; c < count; c++) {
      const targetDir = direction || dirs[Math.floor(Math.random() * dirs.length)];
      const upper = targetDir.toUpperCase();
      const lane = this.lanes[upper];

      if (lane.queue.length >= 8) continue; // Limit lane density

      const types = ['CAR', 'CAR', 'BUS', 'TRUCK', 'MOTORCYCLE'];
      const targetType = (type || types[Math.floor(Math.random() * types.length)]).toUpperCase();

      const spawnDistance = Math.max(220, (lane.queue.at(-1)?.distanceFromStopLine || 0) + spacing(lane.queue.at(-1), {type:targetType}));

      const speeds = {
        CAR: 4.0,
        BUS: 3.2,
        TRUCK: 3.0,
        MOTORCYCLE: 5.0,
        AMBULANCE: 6.0
      };

      const vehicle = {
        id: this.vehicleIdCounter++,
        type: targetType,
        direction: upper,
        isEmergency: targetType === 'AMBULANCE',
        distanceFromStopLine: spawnDistance,
        speed: speeds[targetType] || 4.0,
        waitingTime: 0,
        hasCrossed: false,
        entryTime: Date.now()
      };

      lane.queue.push(vehicle);
      this.vehicles.push(vehicle);
      this.stats.totalSpawned++;
      lastCar = vehicle;
    }

    return lastCar;
  }

  // Backward compatibility alias for UI calls
  addVehicle(direction, type = 'car', count = 1) {
    return this.spawnVehicle(direction, type, count);
  }

  triggerEmergency(direction) {
    if (typeof direction !== 'string') throw new Error('Invalid direction');
    const formatted = direction.charAt(0).toUpperCase() + direction.slice(1).toLowerCase();
    const upper = formatted.toUpperCase();

    if (!this.lanes[upper]) {
      throw new Error(`Invalid direction: ${direction}`);
    }

    if (this.activeEmergency || this.cpu.interruptController.inService) throw new Error('An emergency is already being serviced');
    if (this.cpu.state === 'HALTED') throw new Error('Reset or load a program before triggering emergency');
    const handler = this.cpu.memory.read(this.cpu.memory.read(0x0004));
    if (!handler || typeof handler !== 'object') throw new Error('Loaded program has no emergency ISR');

    // Spawn emergency ambulance at front of requested corridor
    const ambulance = {
      id: this.vehicleIdCounter++,
      type: 'AMBULANCE',
      direction: upper,
      isEmergency: true,
      distanceFromStopLine: 90,
      speed: 6.0,
      waitingTime: 0,
      hasCrossed: false,
      entryTime: Date.now()
    };

    // Preserve lane spacing when inserting the emergency demonstration vehicle.
    let previous = ambulance;
    this.lanes[upper].queue.forEach(v => {
      v.distanceFromStopLine = Math.max(v.distanceFromStopLine, previous.distanceFromStopLine + spacing(previous, v));
      previous = v;
    });
    this.lanes[upper].queue.unshift(ambulance);
    this.vehicles.unshift(ambulance);
    this.stats.totalSpawned++;
    this.stats.emergencyCount++;

    this.activeEmergency = {
      direction: formatted,
      startTime: Date.now(),
      cleared: false
    };

    // Assert emergency code on memory-mapped I/O port 0xF020
    const code = formatted === 'North' ? 1 : formatted === 'South' ? 2 : formatted === 'East' ? 3 : 4;
    this.cpu.memory.writeIO(IO_MAP.EMERGENCY_STATUS, code);

    // Assert hardware interrupt request on Virtual CPU
    this.cpu.triggerInterrupt(0x0004, { direction: formatted, code });

    return { success: true, direction: formatted, code };
  }

  clearEmergency() {
    if (this.activeEmergency) {
      const finished = this.activeEmergency;
      this.activeEmergency = null;
      this.onEmergencyCleared?.(finished);
      this.cpu.memory.writeIO(IO_MAP.EMERGENCY_STATUS, 0);
    }
  }

  /**
   * Physics & Queuing Step
   */
  tick(dt = 0.5) {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 2) throw new Error('Invalid traffic timestep');
    this.simulationTime += dt;
    // Advance already-crossed vehicles once, independently of incoming queues.
    for (const v of this.vehicles) {
      if (v.hasCrossed) v.distanceFromStopLine -= v.speed * dt * 22;
    }
    for (const dir of this.directions) {
      const lane = this.lanes[dir.toUpperCase()];
      let leader = null;
      let crossedThisTick = false;
      for (const v of lane.queue) {
        v.waitingTime ??= 0;
        const desired = v.distanceFromStopLine - v.speed * dt * 18;
        let minimum = this.signals[dir] === 2 ? -Infinity : 30 + vehicleLength(v) / 2 + 3;
        if (leader) minimum = Math.max(minimum, leader.distanceFromStopLine + spacing(leader, v));
        if (crossedThisTick) minimum = Math.max(minimum, 1);
        const next = Math.min(v.distanceFromStopLine, Math.max(desired, minimum));
        if (next > desired) {
          v.waitingTime += dt;
          this.stats.totalWaitTimeSeconds += dt;
        }
        v.distanceFromStopLine = next;
        if (next <= 0 && this.signals[dir] === 2 && !crossedThisTick) {
          v.hasCrossed = true;
          crossedThisTick = true;
          lane.throughput++;
          this.stats.totalPassed++;
          this.stats.passedPerDirection[dir]++;
          this.completedWait += v.waitingTime;
        }
        leader = v;
      }
      lane.queue = lane.queue.filter(v => !v.hasCrossed);
      if (Math.random() < this.spawnRates[dir] * dt && lane.queue.length < 8) this.spawnVehicle(dir);
    }
    this.vehicles = this.vehicles.filter(v => v.distanceFromStopLine > -330);
    this.stats.avgWaitTime = this.stats.totalPassed ? Number((this.completedWait / this.stats.totalPassed).toFixed(1)) : 0;
  }

  allRed() {
    for (const dir of this.directions) {
      this.cpu.memory.writeIO(IO_MAP[`${dir.toUpperCase()}_SIGNAL`], 0);
    }
  }

  setSpawnRate(direction, rate) {
    if (typeof direction !== 'string' || !Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('Invalid spawn rate');
    const formatted = direction.charAt(0).toUpperCase() + direction.slice(1).toLowerCase();
    if (this.spawnRates[formatted] !== undefined) {
      this.spawnRates[formatted] = Math.max(0, Math.min(1.0, rate));
    }
  }


  getState() {
    return {
      simulationTime: this.simulationTime,
      signals: { ...this.signals },
      counts: {
        North: this.lanes.NORTH.queue.length,
        South: this.lanes.SOUTH.queue.length,
        East:  this.lanes.EAST.queue.length,
        West:  this.lanes.WEST.queue.length
      },
      lanes: {
        NORTH: { light: this.lanes.NORTH.light, queueLength: this.lanes.NORTH.queue.length },
        SOUTH: { light: this.lanes.SOUTH.light, queueLength: this.lanes.SOUTH.queue.length },
        EAST:  { light: this.lanes.EAST.light, queueLength: this.lanes.EAST.queue.length },
        WEST:  { light: this.lanes.WEST.light, queueLength: this.lanes.WEST.queue.length }
      },
      currentPhase: this.stats.currentPhase,
      activeEmergency: this.activeEmergency,
      spawnRates: { ...this.spawnRates },
      stats: {
        totalSpawned: this.stats.totalSpawned,
        totalPassed: this.stats.totalPassed,
        averageWaitTimeSeconds: this.stats.avgWaitTime,
        passedPerDirection: { ...this.stats.passedPerDirection },
        emergencyCount: this.stats.emergencyCount
      },
      vehicles: this.vehicles.map(v => ({
        id: v.id,
        type: v.type,
        direction: v.direction,
        distanceFromStopLine: v.distanceFromStopLine,
        hasCrossed: v.hasCrossed,
        isEmergency: v.isEmergency
      }))
    };
  }
}
