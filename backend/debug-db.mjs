import oracledb from 'oracledb';
import 'dotenv/config';

const cfg = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING,
};
console.log('[ENV]', cfg);

const pool = await oracledb.createPool(cfg);
const conn = await pool.getConnection();

const who = await conn.execute(
  "SELECT USER, SYS_CONTEXT('USERENV','SERVICE_NAME') FROM dual"
);
console.log('[WHO]', who.rows);

const cnt = await conn.execute('SELECT COUNT(*) FROM R_PRODUCTS');
console.log('[COUNT R_PRODUCTS]', cnt.rows);

await conn.close();
await pool.close();
