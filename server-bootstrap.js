'use strict';
// Se server.js falhar ao carregar (require), sobe um servidor mínimo para não retornar 503
try {
  require('./server.js');
} catch (e) {
  console.error('[Falha ao carregar server.js]', e.message);
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  const express = require('express');
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.PORT ? '0.0.0.0' : 'localhost';
  app.get('/health', (req, res) => res.status(200).send('ok'));
  app.use((req, res) => res.status(503).send('App em manutenção. Veja os logs do servidor.'));
  app.listen(PORT, HOST, () => {
    console.log('Servidor mínimo em http://%s:%s (server.js falhou)', HOST, PORT);
  });
}
