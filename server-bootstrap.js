'use strict';
// Se server.js falhar ao carregar (require), sobe um servidor mínimo para não retornar 503
try {
  require('./server.js');
} catch (e) {
  console.error('[Falha ao carregar server.js]', e.message);
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  if (!process.env.DB_USER && !process.env.DB_NAME) {
    require('dotenv').config();
    require('dotenv').config({ path: path.join(process.cwd(), '.env') });
  }
  const express = require('express');
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  // Sempre 0.0.0.0 em produção ou quando PORT está definido (evita 503 no proxy Hostinger)
  const HOST = process.env.HOST || ((process.env.PORT || process.env.NODE_ENV === 'production') ? '0.0.0.0' : 'localhost');
  app.get('/health', (req, res) => res.status(200).send('ok'));
  app.use((req, res) => res.status(503).send('App em manutenção. Veja os logs do servidor.'));
  const server = app.listen(PORT, HOST, () => {
    console.log('Servidor mínimo em http://%s:%s (server.js falhou)', HOST, PORT);
  });
  server.on('error', (e) => {
    console.error('Não foi possível subir nem o servidor mínimo:', e.message);
    process.exit(1);
  });
}
