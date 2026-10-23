// OWNER: backend 4 — database schema + helper functions.
import Database from 'better-sqlite3';

// Single SQLite file for the whole demo. Good enough for a class project;
// swap for Postgres later if you want, the queries stay similar.
const db = new Database('fido2.db');
db.pragma('journal_mode = WAL');

// --- Schema -----------------------------------------------------------------
// credentials.public_key + credential_id come from registration.
// credentials.counter is the signature counter — it must never go backwards.
// Checking it on each login is a real replay defense (and a good analysis point).
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,         -- random user handle (base64url)
    username     TEXT UNIQUE NOT NULL,
    display_name TEXT,
    totp_secret  TEXT,                      -- for the fallback-code path
    last_totp_step INTEGER,                 -- last used code's time step (blocks code replay)
    created_at   INTEGER NOT NULL
  );

  -- One-time recovery codes. Store HASHES only, never the plaintext codes.
  CREATE TABLE IF NOT EXISTS recovery_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL,
    code_hash  TEXT NOT NULL,
    used_at    INTEGER,                      -- NULL = still usable
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS credentials (
    credential_id TEXT PRIMARY KEY,         -- base64url
    user_id       TEXT NOT NULL,
    public_key    BLOB NOT NULL,
    counter       INTEGER NOT NULL,
    transports    TEXT,                     -- JSON array, optional
    created_at    INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    method     TEXT NOT NULL,               -- 'passkey' | 'push' | 'code' | 'recovery'
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  -- Every auth attempt lands here. Feeds the security-analysis writeup.
  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT,
    method     TEXT,
    outcome    TEXT,                         -- 'success' | 'fail'
    detail     TEXT,
    at         INTEGER NOT NULL
  );
`);

export default db;

// TODO (backend 4): write small helper functions here (do these FIRST, everyone needs them) —
//   getUserByUsername(), createUser(), saveCredential(),
//   getCredentialsForUser(), updateCounter(), logAttempt()
// so routes don't write raw SQL inline.
