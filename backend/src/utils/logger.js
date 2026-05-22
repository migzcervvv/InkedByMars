'use strict';

const redact = (value) => {
  if (!value || typeof value !== 'object') return value;

  const clone = Array.isArray(value) ? [...value] : { ...value };
  for (const key of Object.keys(clone)) {
    if (/password|token|authorization|cookie/i.test(key)) {
      clone[key] = '[REDACTED]';
    } else if (clone[key] && typeof clone[key] === 'object') {
      clone[key] = redact(clone[key]);
    }
  }
  return clone;
};

const write = (level, message, meta = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(meta),
  };

  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};

