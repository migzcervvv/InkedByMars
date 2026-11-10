const { AsyncLocalStorage } = require('node:async_hooks');
const scope = new AsyncLocalStorage();
exports.run = (runtime, operation) => scope.run(runtime, operation);
exports.current = () => scope.getStore();
exports.env = () => scope.getStore()?.env || process.env;
