'use strict';
const path = require('path');
// Garante .env carregado: raiz do projeto e cwd (Hostinger pode rodar de outro diretório)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  if (!process.env.DB_USER && !process.env.DB_NAME) {
    require('dotenv').config();
    require('dotenv').config({ path: path.join(process.cwd(), '.env') });
  }
} catch (_) {}

const mysql = require('mysql2/promise');

const DEFAULT_HOST = 'localhost';
const FALLBACK_HOST = '127.0.0.1';

function getConfig(overrides) {
  overrides = overrides || {};
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith('mysql')) {
    try {
      const parsed = new URL(url);
      return {
        host: overrides.host || parsed.hostname || DEFAULT_HOST,
        port: parseInt(parsed.port || '3306', 10),
        user: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || ''),
        database: (parsed.pathname || '').replace(/^\//, '') || '',
        waitForConnections: true,
        connectionLimit: 10,
        charset: 'utf8mb4',
        connectTimeout: 10000,
      };
    } catch (e) {
      console.error('[DB] DATABASE_URL inválida:', e.message);
    }
  }
  const dbName = process.env.DB_NAME || '';
  const dbUser = process.env.DB_USER || '';
  if (!dbName || !dbUser) {
    console.error('[DB] Defina DB_NAME e DB_USER no .env ou nas variáveis de ambiente do painel (Hostinger).');
  }
  const host = (process.env.DB_HOST || '').trim() || DEFAULT_HOST;
  return {
    host: overrides.host || host,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: dbUser,
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    connectTimeout: 10000,
  };
}

let pool = mysql.createPool(getConfig());

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

/** Se localhost falhar, tenta 127.0.0.1 (alguns servidores só respondem em um dos dois). */
async function tryFallbackHost() {
  const cfg = getConfig();
  if (cfg.host === FALLBACK_HOST) return false;
  try {
    const newPool = mysql.createPool(getConfig({ host: FALLBACK_HOST }));
    const c = await newPool.getConnection();
    await c.ping();
    c.release();
    pool = newPool;
    process.env.DB_HOST = FALLBACK_HOST;
    console.log('[DB] Conexão OK com host 127.0.0.1 (localhost falhou).');
    return true;
  } catch (err) {
    return false;
  }
}

const db = {
  query(...args) {
    return pool.query(...args);
  },
  getConnection(...args) {
    return pool.getConnection(...args);
  },
  testConnection,
  tryFallbackHost,
};

module.exports = db;
