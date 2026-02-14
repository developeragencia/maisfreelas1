'use strict';
/**
 * Envolve handlers async para que rejeições sejam passadas ao error handler do Express.
 * Evita 503/crash por erro não tratado em rotas async.
 */
function wrapAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
module.exports = { wrapAsync };
