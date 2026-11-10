const mongoose = require('mongoose');
const { current } = require('./runtime');
exports.boundModel = (name, schema) => {
  const fallback = mongoose.models[name] || mongoose.model(name, schema);
  return new Proxy(fallback, {
    get(target, property) {
      const model = current()?.db?.models[name] || target;
      const value = Reflect.get(model, property);
      return typeof value === 'function' && property !== 'schema' ? value.bind(model) : value;
    },
    construct(target, args) { return new (current()?.db?.models[name] || target)(...args); },
  });
};
