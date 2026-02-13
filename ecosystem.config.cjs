/**
 * PM2 - rodar em produção: pm2 start ecosystem.config.cjs
 * Reiniciar: pm2 restart maisfreelas
 * Logs: pm2 logs maisfreelas
 */
module.exports = {
  apps: [
    {
      name: 'maisfreelas',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
