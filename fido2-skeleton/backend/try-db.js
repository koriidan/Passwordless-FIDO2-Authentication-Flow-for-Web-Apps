// Scratch tests for the backend-4 DB helpers. Do NOT commit this file.
// Run from fido2-skeleton/backend:  node try-db.js
import fs from 'node:fs';

// Start from an empty database every run (no manual Remove-Item needed).
// The DB module is imported AFTER this, so it creates fresh tables.
for (const f of ['fido2.db', 'fido2.db-wal', 'fido2.db-shm']) fs.rmSync(f, { force: true });

const {
  createUser, getUserByUsername, getUserById,
  saveCredential, getCredentialsForUser, getCredentialsForId, updateCounter,
  logAttempt,
  setTotpSecret, setLastTotpStep,
  saveRecoveryCodes, getUnusedRecoveryCodes, markRecoveryCodeUsed,
  deleteCredential, getDevicesForUser, getAuditForUser,
} = await import('./src/db/index.js');

let passed = 0, failed = 0;
// Runs one test: prints PASS/FAIL, and catches crashes so later tests still run.
function check(label, fn, expected) {
  let actual;
  try { actual = fn(); } catch (e) { actual = `THREW ${e.name}: ${e.message}`; }
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? passed++ : failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`);
}

console.log('--- users');
createUser({ id: 'abc123', username: 'alice', display_name: 'Alice' });
check('getUserByUsername finds alice', () => getUserByUsername('alice')?.display_name, 'Alice');
check('getUserByUsername unknown -> null', () => getUserByUsername('nobody'), null);
check('getUserById finds alice', () => getUserById('abc123')?.username, 'alice');
check('getUserById unknown -> null', () => getUserById('nope'), null);
check('createUser duplicate -> -1', () => createUser({ id: 'x', username: 'alice', display_name: 'A' }), -1);

console.log('--- credentials');
check('saveCredential', () => saveCredential({
  credential_id: 'cred-1', user_id: 'abc123',
  public_key: new Uint8Array([1, 2, 3]), counter: 0, transports: ['internal'],
}), true);
check('getCredentialsForUser alice -> 1 row', () => getCredentialsForUser('abc123').length, 1);
check('getCredentialsForUser unknown -> []', () => getCredentialsForUser('nobody'), []);
check('getCredentialsForId finds cred-1', () => getCredentialsForId('cred-1')?.user_id, 'abc123');
check('getCredentialsForId unknown -> null', () => getCredentialsForId('nope'), null);
check('updateCounter 0 -> 5', () => updateCounter({ credential_id: 'cred-1', newCounter: 5 }), true);
check('updateCounter 3 (replay)', () => updateCounter({ credential_id: 'cred-1', newCounter: 3 }), false);
check('updateCounter 5 (not higher)', () => updateCounter({ credential_id: 'cred-1', newCounter: 5 }), false);

console.log('--- audit');
check('logAttempt', () => logAttempt({ username: 'alice', method: 'passkey', outcome: 'success', detail: 'test' }), true);

console.log('--- totp');
check('setTotpSecret alice', () => setTotpSecret({ user_id: 'abc123', totp_secret: 'TESTSECRET' }), true);
check('secret stored on user row', () => getUserById('abc123').totp_secret, 'TESTSECRET');
check('setTotpSecret unknown -> false', () => setTotpSecret({ user_id: 'nobody', totp_secret: 'X' }), false);
check('setLastTotpStep NULL -> 100', () => setLastTotpStep({ user_id: 'abc123', step: 100 }), true);
check('setLastTotpStep 100 again (replay)', () => setLastTotpStep({ user_id: 'abc123', step: 100 }), false);
check('setLastTotpStep 99 (older)', () => setLastTotpStep({ user_id: 'abc123', step: 99 }), false);
check('setLastTotpStep 101', () => setLastTotpStep({ user_id: 'abc123', step: 101 }), true);

console.log('--- recovery codes');
createUser({ id: 'bob1', username: 'bob', display_name: 'Bob' });
check('saveRecoveryCodes bob (1 code)', () => saveRecoveryCodes({ user_id: 'bob1', code_hashes: ['bob-salt:bob-hash'] }), true); // bob's codes must not be touched by alice's
check('saveRecoveryCodes alice (3 codes)', () => saveRecoveryCodes({ user_id: 'abc123', code_hashes: ['s1:h1', 's2:h2', 's3:h3'] }), true);
check('alice has 3 unused codes', () => getUnusedRecoveryCodes('abc123').length, 3);
check('rows include id + code_hash', () => getUnusedRecoveryCodes('abc123').map((r) => r.code_hash), ['s1:h1', 's2:h2', 's3:h3']);
let firstId;
try { firstId = getUnusedRecoveryCodes('abc123')[0]?.id; } catch {}
check('markRecoveryCodeUsed first code', () => markRecoveryCodeUsed(firstId), true);
check('markRecoveryCodeUsed same code again (single-use)', () => markRecoveryCodeUsed(firstId), false);
check('alice now has 2 unused codes', () => getUnusedRecoveryCodes('abc123').length, 2);
check('saveRecoveryCodes new set replaces old', () => saveRecoveryCodes({ user_id: 'abc123', code_hashes: ['n1:h1', 'n2:h2'] }), true);
check('only the 2 new codes remain', () => getUnusedRecoveryCodes('abc123').map((r) => r.code_hash), ['n1:h1', 'n2:h2']);
check("bob's code untouched", () => getUnusedRecoveryCodes('bob1').map((r) => r.code_hash), ['bob-salt:bob-hash']);

console.log('--- devices (backend 5)');
saveCredential({ credential_id: 'cred-2', user_id: 'abc123', public_key: new Uint8Array([4, 5, 6]), counter: 0, transports: ['usb'] });
check('getDevicesForUser alice -> 2 devices', () => getDevicesForUser('abc123').length, 2);
check('devices never include public_key', () => getDevicesForUser('abc123').some((d) => 'public_key' in d), false);
check('device rows have only safe columns', () => Object.keys(getDevicesForUser('abc123')[0]).sort(), ['created_at', 'credential_id', 'transports']);
check('getDevicesForUser unknown -> []', () => getDevicesForUser('nobody'), []);
check("bob can't delete alice's passkey", () => deleteCredential({ credential_id: 'cred-2', user_id: 'bob1' }), false);
check('alice deletes her own passkey', () => deleteCredential({ credential_id: 'cred-2', user_id: 'abc123' }), true);
check('deleting it again -> false', () => deleteCredential({ credential_id: 'cred-2', user_id: 'abc123' }), false);
check('alice has 1 device left', () => getDevicesForUser('abc123').length, 1);

console.log('--- audit history (backend 5)');
// `at` is Date.now(), so wait for the clock to tick between logs; otherwise
// two rows can share a timestamp and "newest first" isn't well defined.
const tick = () => { const t = Date.now(); while (Date.now() === t); };
tick(); logAttempt({ username: 'alice', method: 'code', outcome: 'fail', detail: 'older' });
tick(); logAttempt({ username: 'alice', method: 'passkey', outcome: 'success', detail: 'newest' });
check('getAuditForUser returns an array', () => Array.isArray(getAuditForUser('alice')), true);
check('alice has 3 attempts', () => getAuditForUser('alice').length, 3);
check('newest attempt comes first', () => getAuditForUser('alice')[0].detail, 'newest');
check('rows are sorted newest -> oldest', () => getAuditForUser('alice').map((r) => r.detail), ['newest', 'older', 'test']);
check('getAuditForUser unknown -> []', () => getAuditForUser('nobody'), []);
for (let i = 0; i < 55; i++) logAttempt({ username: 'spammer', method: 'code', outcome: 'fail', detail: `try ${i}` });
check('audit is capped at 50 rows', () => getAuditForUser('spammer').length, 50);
check("alice's audit doesn't include other users", () => getAuditForUser('alice').every((r) => r.username === 'alice'), true);

console.log(`\n${passed} passed, ${failed} failed`);
