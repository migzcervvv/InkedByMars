const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
// Standalone validation chains preserve the existing field rules without Express.
exports.validate = (...chains) => async (c, next) => {
  const input = c.get('input');
  // Hono's global '*' middleware runs before route-specific parameters are
  // exposed. Capture them here, on the matched validation route, rather than
  // using the empty snapshot taken by the global JSON middleware.
  input.params = c.req.param();
  for (const chain of chains.flat()) await chain.run(input);
  const result = validationResult(input);
  if (!result.isEmpty()) throw new AppError('Please correct the highlighted fields.', 400, 'VALIDATION_ERROR', result.array().map(({ path, msg }) => ({ field: path, message: msg })));
  await next();
};
exports.input = async (c, next) => {
  let body = {};
  if (['POST','PUT','PATCH'].includes(c.req.method) && c.req.header('Content-Type')?.includes('application/json')) {
    const reader = c.req.raw.body?.getReader(); const chunks = []; let size = 0;
    if (reader) { try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 65536) { await reader.cancel(); throw new AppError('JSON request too large. Upload images separately.', 413); } chunks.push(part.value); } } finally { reader.releaseLock(); } }
    try { body = size ? JSON.parse(Buffer.concat(chunks).toString()) : {}; } catch { throw new AppError('Malformed JSON.', 400); }
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new AppError('JSON object required.', 400);
  }
  c.set('input', { body, query: c.req.query(), params: c.req.param(), headers: Object.fromEntries(c.req.raw.headers), requestId: c.get('requestId'), ip: c.req.header('CF-Connecting-IP') || 'local' });
  await next();
};
