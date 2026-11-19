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

//daniel: here the DB helpers are using snake_case because its just easier to align them with the DB, but everywhere else is still using camel. just becareful.
const get_user_stmt = db.prepare('SELECT * FROM users WHERE username = ?');
export function getUserByUsername(username){
 //taking in useranme and finding it within db
   if(username == null)
     return null;
     
   //find username
   const queriedUser = get_user_stmt.get(username);
   if(queriedUser == null)
     return null;
      
   return queriedUser;
}

const get_userById_stmt = db.prepare('SELECT * FROM users WHERE id = ?');
export function getUserById(id){
 //taking in id and finding info within db
   if(id == null)
     return null;
     
   //find username
   const queriedUser = get_userById_stmt.get(id);
   if(queriedUser == null)
     return null;
      
   return queriedUser;
}

const create_user_stmt = db.prepare('INSERT INTO users (id, username, display_name, created_at) VALUES (?, ?, ?, ?)');
export function createUser({id, username, display_name}){
  if(getUserByUsername(username) == null) //checking for dups
    create_user_stmt.run(id, username, display_name, Date.now());
  else{
    console.log("username is taken");
    return -1;
  }
}
const save_creds_stmt = db.prepare('INSERT INTO credentials (credential_id, user_id, public_key, counter,transports, created_at) VALUES (?, ?, ?, ?, ?, ?)');
export function saveCredential({credential_id, user_id, public_key, counter,transports}){
  //saving credentials after registration succeeds
  
  const info = save_creds_stmt.run(credential_id, user_id, Buffer.from(public_key), counter,JSON.stringify(transports), Date.now());

  return info.changes === 1;

  
}

const get_credsByUser_stmt= db.prepare('SELECT * FROM credentials WHERE user_id= ?');
export function getCredentialsForUser(user_id){
  const creds = get_credsByUser_stmt.all(user_id);
  return creds; //backend 1 pls parse the return of transports
}


const get_credsById_stmt= db.prepare('SELECT * FROM credentials WHERE credential_id = ?');
export function getCredentialsForId(credential_id){
  const creds = get_credsById_stmt.get(credential_id);
  if(creds== null)
    return null;
  return creds;
}

const update_counter_stmt = db.prepare('UPDATE credentials SET counter = ? WHERE ? > counter AND credential_id = ?');
export function updateCounter({credential_id, newCounter}){
//Daniel: backend 1 becareful with cases where there are 0 for counter and 0 for new counter, if both is 0 then new value will just be 0.
  const update = update_counter_stmt.run(newCounter, newCounter, credential_id);
  return update.changes === 1;
}

const log_attempt_stmt = db.prepare('INSERT INTO audit_log(username, method, outcome, detail, at) VALUES (?, ?, ?, ?, ?)');
export function  logAttempt({username, method, outcome, detail}){
  const log = log_attempt_stmt.run(username, method, outcome, detail, Date.now());
  return log.changes === 1;
}


const delete_creds_stmt = db.prepare('DELETE FROM credentials WHERE credential_id = ? AND user_id = ?');
export function deleteCredential({ credential_id, user_id }){
  const deleted = delete_creds_stmt.run(credential_id, user_id);
  return deleted.changes === 1;
}


const get_auditUser_stmt= db.prepare('SELECT * FROM audit_log WHERE username = ? ORDER BY at DESC LIMIT 50');
export function getAuditForUser(username){
  const audit = get_auditUser_stmt.all(username);
  return audit;
}
const get_devicesUser_stmt= db.prepare('SELECT credential_id, created_at, transports FROM credentials WHERE user_id = ?');
export function getDevicesForUser(user_id){
  const device = get_devicesUser_stmt.all(user_id);
  return device;
}


//TOTP

const set_totp_stmt = db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?')
export function setTotpSecret({user_id, totp_secret}){
  const set = set_totp_stmt.run(totp_secret, user_id);
  return set.changes === 1;
}

const set_lastTotp_stmt = db.prepare('UPDATE users SET last_totp_step = ? WHERE id = ? AND (last_totp_step < ? OR last_totp_step IS NULL)')
export function setLastTotpStep({user_id, step}){// only if higher; handle NULL
  const lastSet = set_lastTotp_stmt.run(step, user_id, step);
  return lastSet.changes === 1;
}      
        
//RECOVERY

const save_code_stmt = db.prepare('INSERT INTO recovery_codes(user_id, code_hash) VALUES (?, ?)');

const delete_code_stmt = db.prepare('DELETE FROM recovery_codes WHERE user_id = ?');
const replaceCode = db.transaction((user_id, code_hashes) =>{
    delete_code_stmt.run(user_id)
    for(const code_hash of code_hashes){
      save_code_stmt.run(user_id, code_hash);
    }
});
export function saveRecoveryCodes({user_id, code_hashes})   // delete old set + insert new, in one transaction
{
  replaceCode(user_id, code_hashes);
  return true;
}

const get_unusedCode_stmt = db.prepare('SELECT * FROM recovery_codes WHERE used_at IS NULL AND user_id = ?');
export function getUnusedRecoveryCodes(user_id){           // returns [{ id, code_hash }, ...] where used_at IS NULL
  const unusedCode = get_unusedCode_stmt.all(user_id);
  return unusedCode;

}

const mark_recoveryCode_stmt= db.prepare('UPDATE recovery_codes SET used_at = ? WHERE used_at IS NULL AND id = ?')
export function markRecoveryCodeUsed(id){                  // AND used_at IS NULL, return changes === 1
  const mark = mark_recoveryCode_stmt.run(Date.now(), id);
  return mark.changes === 1;
}


//SESSION

const create_session_stmt = db.prepare('INSERT INTO sessions(token, user_id, method, created_at, expires_at) VALUES (?,?,?,?,?)')

export function createSessionRow({token, user_id, method, expires_at}) {
  const create = create_session_stmt.run(token, user_id, method, Date.now(), expires_at);
  
  return create.changes === 1;
}

const get_session_stmt = db.prepare('SELECT * FROM sessions WHERE token = ?');
export function getSessionRow(token){
  if(token == null)
    return null;
  const getSession = get_session_stmt.get(token);
  if(getSession == null)
     return null;
      
   return getSession;
}

const delete_session_stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
export function deleteSessionRow(token){
  const deleted = delete_session_stmt.run(token);
  return deleted.changes === 1;
}



