/**
 * database.js
 * SQLite Database Persistence using Node.js Native SQLite Engine
 * Persists simulation sessions, CPU execution logs, traffic metrics, emergency events, and settings.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../traffic_simulator.db');

export class Database {
  constructor(filePath = process.env.NODE_ENV === 'test' ? ':memory:' : dbPath) {
    this.db = new DatabaseSync(filePath);
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        total_cycles INTEGER DEFAULT 0,
        total_instructions INTEGER DEFAULT 0,
        total_vehicles_passed INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS cpu_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        cycle INTEGER,
        pc INTEGER,
        mnemonic TEXT,
        opcode INTEGER,
        alu_result INTEGER,
        flags_z INTEGER,
        flags_c INTEGER,
        flags_n INTEGER,
        flags_v INTEGER,
        created_at TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS traffic_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        timestamp TEXT,
        north_count INTEGER,
        south_count INTEGER,
        east_count INTEGER,
        west_count INTEGER,
        north_signal INTEGER,
        south_signal INTEGER,
        east_signal INTEGER,
        west_signal INTEGER,
        throughput INTEGER,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS emergency_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        direction TEXT,
        trigger_time TEXT,
        clear_time TEXT,
        duration_ms INTEGER,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );
    `);
  }

  createSession() {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (start_time, status)
      VALUES (?, 'ACTIVE')
    `);
    stmt.run(new Date().toISOString());
    const row = this.db.prepare('SELECT last_insert_rowid() as id').get();
    return row.id;
  }

  endSession(sessionId, summary = {}) {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET end_time = ?,
          total_cycles = ?,
          total_instructions = ?,
          total_vehicles_passed = ?,
          status = 'COMPLETED'
      WHERE id = ?
    `);
    stmt.run(
      new Date().toISOString(),
      summary.totalCycles || 0,
      summary.totalInstructions || 0,
      summary.totalVehiclesPassed || 0,
      sessionId
    );
  }

  logCpuExecution(sessionId, traceEntry) {
    if (!traceEntry) return;
    const stmt = this.db.prepare(`
      INSERT INTO cpu_logs (
        session_id, cycle, pc, mnemonic, opcode, alu_result,
        flags_z, flags_c, flags_n, flags_v, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      sessionId,
      traceEntry.cycle,
      traceEntry.pc,
      traceEntry.instruction?.mnemonic || 'UNKNOWN',
      traceEntry.instruction?.opcode || 0,
      traceEntry.aluResult !== null ? traceEntry.aluResult : null,
      traceEntry.flags?.Z || 0,
      traceEntry.flags?.C || 0,
      traceEntry.flags?.N || 0,
      traceEntry.flags?.V || 0,
      new Date().toISOString()
    );
  }

  recordTrafficStats(sessionId, stats) {
    const stmt = this.db.prepare(`
      INSERT INTO traffic_stats (
        session_id, timestamp, north_count, south_count, east_count, west_count,
        north_signal, south_signal, east_signal, west_signal, throughput
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      sessionId,
      new Date().toISOString(),
      stats.counts?.North || 0,
      stats.counts?.South || 0,
      stats.counts?.East || 0,
      stats.counts?.West || 0,
      stats.signals?.North || 0,
      stats.signals?.South || 0,
      stats.signals?.East || 0,
      stats.signals?.West || 0,
      stats.stats?.totalPassed || 0
    );
  }

  recordEmergencyEvent(sessionId, event) {
    const stmt = this.db.prepare(`
      INSERT INTO emergency_events (
        session_id, direction, trigger_time, clear_time, duration_ms
      ) VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      sessionId,
      event.direction,
      event.triggerTime,
      event.clearTime || null,
      event.durationMs || null
    );
  }

  completeEmergency(sessionId) {
    this.db.prepare(`UPDATE emergency_events SET clear_time = ?, duration_ms =
      MAX(0, CAST((julianday(?) - julianday(trigger_time)) * 86400000 AS INTEGER))
      WHERE session_id = ? AND clear_time IS NULL`).run(new Date().toISOString(), new Date().toISOString(), sessionId);
  }

  close() { this.db.close(); }

  getAnalyticsSummary(sessionId) {
    const sessionStmt = sessionId
      ? this.db.prepare('SELECT * FROM sessions WHERE id = ?')
      : this.db.prepare('SELECT * FROM sessions ORDER BY id DESC LIMIT 1');
    const session = sessionId ? sessionStmt.get(sessionId) : sessionStmt.get();

    const currentSessionId = session?.id || 1;

    const cpuStats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalLogged,
        COUNT(DISTINCT pc) as uniqueInstructions,
        MAX(cycle) as maxCycles
      FROM cpu_logs
      WHERE session_id = ?
    `).get(currentSessionId);

    const freqRows = this.db.prepare(`
      SELECT mnemonic, COUNT(*) as count
      FROM cpu_logs
      WHERE session_id = ?
      GROUP BY mnemonic
      ORDER BY count DESC
    `).all(currentSessionId);

    const trafficHistory = this.db.prepare(`
      SELECT timestamp, north_count, south_count, east_count, west_count, throughput
      FROM traffic_stats
      WHERE session_id = ?
      ORDER BY id DESC
      LIMIT 20
    `).all(currentSessionId);

    const emergencyEvents = this.db.prepare(`
      SELECT * FROM emergency_events
      WHERE session_id = ?
      ORDER BY id DESC
      LIMIT 10
    `).all(currentSessionId);

    return {
      session,
      cpuStats,
      instructionFrequency: freqRows,
      trafficHistory: trafficHistory.reverse(),
      emergencyEvents
    };
  }

  saveSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
    `);
    stmt.run(key, JSON.stringify(value), new Date().toISOString());
  }

  getSetting(key) {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    if (!row) return null;
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }
}
