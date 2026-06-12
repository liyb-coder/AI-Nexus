import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic } from 'sql.js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HOME = homedir();
const DATA_DIR = join(HOME, 'Library', 'Application Support', 'ai-nexus');
const DB_PATH = join(DATA_DIR, 'data.db');
const USE_MEMORY = process.env.DB_MEMORY === '1' || process.env.VITEST === 'true';

let SQL: SqlJsStatic | null = null;
let db: SqlJsDatabase | null = null;

/**
 * Compatibility wrapper around sql.js to provide a better-sqlite3-like API.
 */
export class AppDatabase {
  private db: SqlJsDatabase;
  private _memory: boolean;

  constructor(database: SqlJsDatabase, memory: boolean) {
    this.db = database;
    this._memory = memory;
  }

  /** Execute SQL and return this for chaining */
  exec(sql: string): void {
    this.db.exec(sql);
  }

  /** Create a prepared-statement-like object */
  prepare(sql: string) {
    const self = this;
    return {
      all(...params: unknown[]) {
        const stmt = self.db.prepare(sql);
        if (params.length > 0) stmt.bind(params as import('sql.js').SqlValue[]);
        const rows: unknown[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      },
      get(...params: unknown[]) {
        const stmt = self.db.prepare(sql);
        if (params.length > 0) stmt.bind(params as import('sql.js').SqlValue[]);
        let result: unknown = undefined;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        return result;
      },
      run(...params: unknown[]) {
        const finalSql = self._interpolateParams(sql, params);
        self.db.run(finalSql);
        return { changes: self.db.getRowsModified() };
      },
      bind(_params: unknown[]) {},
    };
  }

  /** Save to disk (no-op for memory mode) */
  save(): void {
    if (!this._memory) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      writeFileSync(DB_PATH, buffer);
    }
  }

  /** Enable/disable pragmas */
  pragma(_sql: string): void {
    // sql.js handles foreign_keys internally
  }

  /** Close the database */
  close(): void {
    this.save();
    this.db.close();
  }

  /** Return the raw sql.js database (for exec calls) */
  raw(): SqlJsDatabase {
    return this.db;
  }

  private _interpolateParams(sql: string, params: unknown[]): string {
    if (params.length === 0) return sql;
    let idx = 0;
    return sql.replace(/\?/g, () => {
      const val = params[idx++];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      return `'${String(val)}'`;
    });
  }
}

export function getDbPath(): string {
  return USE_MEMORY ? ':memory:' : DB_PATH;
}

export async function getDatabase(): Promise<AppDatabase> {
  if (db && SQL) return new AppDatabase(db, USE_MEMORY);

  // Initialize sql.js (loads WASM)
  SQL = await initSqlJs();

  if (USE_MEMORY) {
    db = new SQL.Database();
    console.log('[db] SQLite initialized in-memory (test mode)');
  } else {
    // Load existing or create new
    if (existsSync(DB_PATH)) {
      const buffer = readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log(`[db] SQLite loaded from ${DB_PATH}`);
    } else {
      db = new SQL.Database();
      if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
      }
      console.log(`[db] SQLite created at ${DB_PATH}`);
    }
  }

  const wrapper = new AppDatabase(db, USE_MEMORY);

  // Enable foreign keys
  wrapper.exec('PRAGMA foreign_keys = ON');

  // Run migrations
  const migrationPath = join(__dirname, 'migrations', '001_initial.sql');
  if (existsSync(migrationPath)) {
    const sql = readFileSync(migrationPath, 'utf-8');
    wrapper.exec(sql);
    wrapper.save();
    console.log('[db] Migrations applied');
  } else {
    console.warn('[db] Migration file not found:', migrationPath);
  }

  return wrapper;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export async function initAutoSave(database: AppDatabase): Promise<void> {
  // Auto-save to disk every 30 seconds
  if (!USE_MEMORY && !intervalId) {
    intervalId = setInterval(() => {
      database.save();
    }, 30000);
  }
}

export function closeDatabase(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (db) {
    db.close();
    db = null;
    console.log('[db] Database closed');
  }
}
