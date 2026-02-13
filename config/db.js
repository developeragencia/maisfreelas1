'use strict';
require('dotenv').config();
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
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  };
}

const pool = mysql.createPool(getConfig());

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
