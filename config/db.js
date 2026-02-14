'use strict';
const path = require('path');
// Garante .env carregado mesmo se este módulo for o primeiro a rodar
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  if (!process.env.DB_USER && !process.env.DB_NAME) require('dotenv').config();
} catch (_) {}

const mysql = require('mysql2/promise');

function getConfig() {
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith('mysql')) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname || '127.0.0.1',
        port: parseInt(parsed.port || '3306', 10),
        user: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || ''),
        database: (parsed.pathname || '').replace(/^\//, '') || '',
        waitForConnections: true,
        connectionLimit: 10,
        charset: 'utf8mb4',
      };
    } catch (e) {
      console.error('[DB] DATABASE_URL inválida:', e.message);
    }
  }
  const dbName = process.env.DB_NAME || '';
  const dbUser = process.env.DB_USER || '';
  if (!dbName || !dbUser) {
    console.error('[DB] Defina DB_NAME e DB_USER no arquivo .env na raiz do projeto.');
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: dbUser,
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  };
}

let pool;
try {
  pool = mysql.createPool(getConfig());
} catch (e) {
  console.error('[DB] createPool:', e.message);
  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: 2,
    charset: 'utf8mb4',
  });
}

async function testConnection() {
  try {
    const c = await pool.getConnection();
    await c.ping();
    c.release();
    return { ok: true };
  } catch (e) {
    console.error('[DB]', e.message);
    return { ok: false, message: e.message, code: e.code };
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
