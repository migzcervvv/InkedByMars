import { DurableObject } from 'cloudflare:workers';
import mongoose from 'mongoose';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import runtime from './bindings/runtime';
import { input } from './middlewares/input';
import { api } from './routes/api';
import { upload, readMedia } from './routes/media';
import cleanup from './services/holdCleanupService';
import retention from './services/referenceRetentionService';
import './models/Admin';
import './models/Booking';
import './models/Schedule';
import './models/AvailabilitySettings';

mongoose.set('transactionAsyncLocalStorage', true);
const app = new Hono();
const standardHeaders = secureHeaders();
const mediaHeaders = secureHeaders({ crossOriginResourcePolicy: 'cross-origin' });
app.use('*', (c, next) => (c.req.path.startsWith('/media/') ? mediaHeaders : standardHeaders)(c, next));
app.use('*', async (c, next) => { c.set('requestId', crypto.randomUUID()); c.header('X-Request-Id', c.get('requestId')); await next(); });
app.use('*', async (c, next) => {
  const origins = String(c.env.CLIENT_URL || 'http://localhost:5173').split(',').map(x => x.trim());
  const origin = c.req.header('Origin');
  if (origin && !origins.includes(origin)) return c.json({ success: false, message: 'Origin is not allowed.' }, 403);
  return cors({ origin: value => origins.includes(value) ? value : '', credentials: true, allowHeaders: ['Content-Type','Authorization','X-Request-Id','X-File-Size'], exposeHeaders: ['X-Request-Id'], allowMethods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] })(c, next);
});
export const handleError = (error, c) => {
  const status = error.statusCode || (error.code === 11000 ? 409 : ['ValidationError','CastError'].includes(error.name) ? 400 : 500);
  console.error(JSON.stringify({ requestId: c.get('requestId'), code: error.code || error.name, status, providerStatus: error.providerStatus, invalidBindings: error.invalidBindings }));
  const errors=Array.isArray(error.details) ? error.details : Object.values(error.errors || {}).map(item=>({field:item.path,message:item.message}));
  return c.json({ success: false, requestId: c.get('requestId'), code: typeof error.code === 'string' ? error.code : 'API_ERROR', message: status < 500 || error.isOperational ? error.message : 'The server could not complete the request.', errors, details: error.details }, status);
};
app.onError(handleError);
app.use('/api/*', async (c, next) => {
  const limiter = c.req.path === '/api/auth/login' ? c.env.AUTH_LIMITER : c.env.API_LIMITER;
  if (limiter && !(await limiter.limit({key:c.req.header('CF-Connecting-IP') || 'local'})).success) return c.json({success:false,message:'Too many requests. Try again later.'},429);
  await next();
});
app.get('/health', c => c.json({ status: 'ok', runtime: 'cloudflare-workers' }));
app.get('/api/health', c => c.json({ status: 'ok', runtime: 'cloudflare-workers' }));
app.post('/api/uploads', upload);
app.get('/media/:id', readMedia);
app.all('/api/*', c => c.env.DATABASE.get(c.env.DATABASE.idFromName('primary')).fetch(c.req.raw));
app.notFound(c => c.json({ success: false, message: 'Route not found.' }, 404));

export class DatabaseAPI extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.connection = mongoose.createConnection();
    for (const name of mongoose.modelNames()) this.connection.model(name, mongoose.model(name).schema);
    this.bookingWrites = Promise.resolve();
    this.withBookingWrites = operation => {
      const result = this.bookingWrites.then(operation);
      this.bookingWrites = result.catch(() => {});
      return result;
    };
    this.api = new Hono();
    this.api.onError(handleError);
    this.api.use('*', async (c, next) => { c.set('requestId', crypto.randomUUID()); await next(); });
    this.api.use('*', input);
    const serializeBookingWrites = (c, next) => c.req.method === 'GET' || c.req.method === 'HEAD'
      ? next()
      : this.withBookingWrites(next);
    this.api.use('/api/bookings/*', serializeBookingWrites);
    this.api.use('/api/schedule/*', serializeBookingWrites);
    this.api.use('/api/auth/users/*', serializeBookingWrites);
    this.api.post('/api/auth/register', serializeBookingWrites);
    this.api.post('/api/public/bookings', serializeBookingWrites);
    this.api.route('/api', api);
    this.api.post('/internal/cleanup', async c => {
      const results = await Promise.allSettled([
        this.withBookingWrites(() => cleanup.expireStaleBookingHolds()),
        retention.purgeExpiredReferences({ env: this.env, exclusive: this.withBookingWrites }),
      ]);
      for (const result of results) if (result.status === 'rejected') throw result.reason;
      return c.json({ success: true });
    });
  }
  async fetch(request) {
    return runtime.run({ env: this.env, db: this.connection, origin: new URL(request.url).origin, waitUntil: promise => this.ctx.waitUntil(promise) }, async () => {
      try {
        if (this.connection.readyState !== 1) {
          this.connecting ||= this.connection.openUri(this.env.MONGO_URI, { maxPoolSize: 3, minPoolSize: 0, serverSelectionTimeoutMS: 5000, autoIndex: false }).finally(() => { this.connecting = null; });
          await this.connecting;
        }
        return await this.api.fetch(request, this.env, { waitUntil: promise => this.ctx.waitUntil(promise), passThroughOnException() {} });
      } catch (error) {
        const mongoErrors = [error, ...Array.from(error?.reason?.servers?.values() || [], server => server.error)]
          .flatMap(item => [item, item?.cause]).filter(Boolean);
        console.error(JSON.stringify({
          event: 'database.connection_failed',
          mongoUriConfigured: Boolean(this.env.MONGO_URI),
          errorTypes: [...new Set(mongoErrors.map(item => item.name).filter(name => /^[A-Za-z]+Error$/.test(name)))],
          errorCodes: [...new Set(mongoErrors.map(item => item.code).filter(code =>
            Number.isSafeInteger(code) || (typeof code === 'string' && /^[A-Z][A-Z_0-9]{1,39}$/.test(code))))],
        }));
        return Response.json({ success: false, code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable.' }, { status: 503 });
      }
    });
  }
}
export default {
  fetch: app.fetch,
  async scheduled(_event, env) {
    const database = env.DATABASE.get(env.DATABASE.idFromName('primary'));
    const response = await database.fetch(new Request('https://internal/internal/cleanup', { method: 'POST' }));
    if (!response.ok) throw new Error('Scheduled booking cleanup failed.');
  },
};
