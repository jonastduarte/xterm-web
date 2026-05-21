import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { dataDir } from './config';

// Banco físico padrão em dataDir/database.sqlite se DB_FILE não estiver configurado
const defaultDbPath = path.join(dataDir, 'database.sqlite');
const dbPath = process.env.DB_FILE || defaultDbPath;

console.log(`Database path: ${dbPath}`);
const parentDir = path.dirname(dbPath);
if (!fs.existsSync(parentDir)) {
  fs.mkdirSync(parentDir, { recursive: true });
}

// Validar permissão de escrita no diretório do banco
try {
  fs.accessSync(parentDir, fs.constants.W_OK);
  console.log(`SQLite database directory is writable: ${parentDir}`);
} catch (err: any) {
  console.error(`CRITICAL ERROR: SQLite database directory is NOT writable! Path: ${parentDir}. Error: ${err.message}`);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database successfully.');
    db.serialize(() => {
      // Users — now with master_password_hash for vault
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        password TEXT,
        master_password_hash TEXT,
        role TEXT DEFAULT 'user'
      )`);
      
      const adminHash = bcrypt.hashSync('admin', 10);
      db.run(`INSERT INTO users (id, username, password, role) SELECT 1, 'admin', ?, 'admin' WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1)`, [adminHash]);
      
      // Migrate: add master_password_hash column if it doesn't exist
      db.run(`ALTER TABLE users ADD COLUMN master_password_hash TEXT`, () => { /* ignore if exists */ });

      db.run(`CREATE TABLE IF NOT EXISTS folders (id INTEGER PRIMARY KEY, name TEXT, parent_id INTEGER, user_id INTEGER)`);
      db.run(`ALTER TABLE folders ADD COLUMN parent_id INTEGER`, () => { /* ignore if exists */ });
      db.run(`ALTER TABLE folders ADD COLUMN user_id INTEGER DEFAULT 1`, () => { /* ignore */ });
      db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, () => { /* ignore */ });
      
      // Sessions — with protocol, auth_type, private_key support
      db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        host TEXT NOT NULL,
        port INTEGER DEFAULT 22,
        username TEXT NOT NULL,
        password TEXT,
        folder_id INTEGER,
        protocol TEXT DEFAULT 'ssh',
        auth_type TEXT DEFAULT 'password',
        private_key TEXT,
        use_sftp INTEGER DEFAULT 1,
        user_id INTEGER
      )`);

      // Migrate older schemas: add columns if they don't exist
      db.run(`ALTER TABLE sessions ADD COLUMN folder_id INTEGER`, () => { /* ignore if exists */ });
      db.run(`ALTER TABLE sessions ADD COLUMN protocol TEXT DEFAULT 'ssh'`, () => { /* ignore */ });
      db.run(`ALTER TABLE sessions ADD COLUMN auth_type TEXT DEFAULT 'password'`, () => { /* ignore */ });
      db.run(`ALTER TABLE sessions ADD COLUMN private_key TEXT`, () => { /* ignore */ });
      db.run(`ALTER TABLE sessions ADD COLUMN use_sftp INTEGER DEFAULT 1`, () => { /* ignore */ });
      db.run(`ALTER TABLE sessions ADD COLUMN user_id INTEGER DEFAULT 1`, () => { /* ignore */ });
      
      // Upgrade default admin role
      db.run(`UPDATE users SET role = 'admin' WHERE id = 1`);

      // Connection history
      db.run(`CREATE TABLE IF NOT EXISTS connection_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        session_name TEXT,
        host TEXT,
        protocol TEXT,
        connected_at TEXT DEFAULT (datetime('now')),
        disconnected_at TEXT,
        status TEXT DEFAULT 'connected'
      )`);

      // Settings table — for auto-launch, preferences, etc.
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`);
    });
  }
});

export const dbQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

export const dbRun = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err); else resolve(this);
    });
  });
};

export default db;