'use strict';

const isDev = require('are-we-dev');
const path = require('path');

module.exports = {
  logger: require('./logger'),
  'flush-request': require('./flush-request'),
  requestid: require('./requestid'),
  postgres: require('./postgres'),
  transaction: require('./transaction'),
  redis: require('./redis'),
  build
};

function build(middleware) {
  // We are NOT in production.
  if (isDev()) {
    const dev = require('./dev-only');

    // Add a middleware that runs between each middleware layer so we can detect
    // slow views, hangs, etc.
    const cwd = process.cwd();
    const result = middleware.reduce((lhs, rhs) => {
      const [mw, ...args] = Array.isArray(rhs) ? rhs : [rhs];
      return [...lhs, dev(mw), mw(...args)];
    }, []);

    result.push(dev('registry/handlers/*'));
    return result;
  }

  // Build for production.
  return middleware.map(xs => {
    const [mw, ...args] = Array.isArray(xs) ? xs : [xs];
    return require(xs)(...args);
  });
}
