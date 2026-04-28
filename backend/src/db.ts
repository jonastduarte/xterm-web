import sqlite3 from 'sqlite3';

// Using a persistent file if DB_FILE env is provided, else in-memory
const dbPath = process.env.DB_FILE || ':memory:';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.serialize(() => {
      // Users — now with master_password_hash for vault
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        password TEXT,
        master_password_hash TEXT
      )`);
      db.run(`INSERT INTO users (id, username, password) SELECT 1, 'admin', 'admin' WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1)`);
      
      // Migrate: add master_password_hash column if it doesn't exist
      db.run(`ALTER TABLE users ADD COLUMN master_password_hash TEXT`, () => { /* ignore if exists */ });

      // Folders
      db.run(`CREATE TABLE IF NOT EXISTS folders (id INTEGER PRIMARY KEY, name TEXT, parent_id INTEGER)`);
      db.run(`ALTER TABLE folders ADD COLUMN parent_id INTEGER`, () => { /* ignore if exists */ });
      
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
        use_sftp INTEGER DEFAULT 1
      )`);

      // Migrate older schemas: add columns if they don't exist
      db.run(`ALTER TABLE sessions ADD COLUMN folder_id INTEGER`, () => { /* ignore if exists */ });
      db.run(`ALTER TABLE sessions ADD COLUMN protocol TEXT DEFAULT 'ssh'`, () => { /* ignore */ });
      db.run(`ALTER TABLE sessions ADD COLUMN auth_type TEXT DEFAULT 'password'`, () => { /* ignore */ });
      db.run(`ALTER TABLE sessions ADD COLUMN private_key TEXT`, () => { /* ignore */ });
      db.run(`ALTER TABLE sessions ADD COLUMN use_sftp INTEGER DEFAULT 1`, () => { /* ignore */ });

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