const argon2 = require('argon2');
const db = require('../config/db');

(async () => {
  const username = process.argv[2];
  const candidate = process.argv[3];
  if (!username || !candidate) {
    console.error('Usage: node scripts/verify_password.js <username> <password>');
    process.exit(2);
  }
  try {
    const { rows } = await db.query('SELECT password FROM users WHERE username = $1', [username]);
    if (!rows || rows.length === 0) {
      console.log('USER_NOT_FOUND');
      process.exit(0);
    }
    const hash = rows[0].password;
    const ok = await argon2.verify(hash, candidate);
    console.log(ok ? 'MATCH' : 'NO_MATCH');
  } catch (e) {
    console.error('ERROR', e.message);
    process.exit(1);
  }
})();
