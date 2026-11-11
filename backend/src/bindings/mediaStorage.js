const AppError = require('../utils/AppError');

// The app owns object keys and URLs. Only this adapter knows the provider API.
function createMediaStorage(env, fetcher = fetch) {
  const project = env.SUPABASE_URL?.trim().replace(/\/$/, '');
  const secret = env.SUPABASE_SECRET_KEY?.trim();
  const bucket = env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(project || '') ||
      !/^sb_secret_[\w-]+$/.test(secret || '') || !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(bucket || '')) {
    throw new AppError('Media storage is not configured. Check the Worker storage settings.', 503, 'MEDIA_CONFIG');
  }

  async function request(operation, method, route, key, options = {}) {
    const path = key.split('/').map(encodeURIComponent).join('/');
    const { headers, signal, ...init } = options;
    const timeout = AbortSignal.timeout(method === 'POST' ? 90000 : 20000);
    let response;
    try {
      response = await fetcher(`${project}/storage/v1/${route}/${bucket}/${path}`, {
        ...init, method, redirect: 'manual',
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        headers: { apikey: secret, 'User-Agent': 'InkedByMars-Worker/1.0', ...headers },
      });
    } catch {
      if (signal?.aborted) throw signal.reason;
      throw new AppError('Media storage could not be reached.', 502, 'MEDIA_UNAVAILABLE');
    }
    if (response.ok) return response;
    if (response.status === 404 && method === 'DELETE') {
      const error = await response.json().catch(() => null);
      if (error?.code === 'NoSuchKey' || /^object not found\.?$/i.test(error?.message || '')) return null;
    }
    // Do not return provider response bodies or credentials to the client.
    if (!response.bodyUsed) await response.body?.cancel().catch(() => {});
    if (response.status === 404 && (method === 'GET' || method === 'HEAD')) return null;
    if (response.status === 413 && method === 'POST') {
      throw new AppError('The storage bucket rejected the image size.', 413, 'UPLOAD_SIZE');
    }
    const error = new AppError(`Media storage could not ${operation} the image.`, 502, 'MEDIA_UNAVAILABLE');
    error.providerStatus = response.status;
    throw error;
  }

  return {
    async put(key, body, { contentType, signal }) {
      const response = await request('store', 'POST', 'object', key, {
        body, signal, duplex: 'half', headers: { 'Content-Type': contentType, 'x-upsert': 'false' },
      });
      await response.body?.cancel();
    },
    async head(key) {
      return Boolean(await request('check', 'HEAD', 'object/info', key));
    },
    async get(key) {
      return request('read', 'GET', 'object/authenticated', key);
    },
    async delete(key) {
      const response = await request('remove', 'DELETE', 'object', key);
      await response?.body?.cancel();
    },
  };
}

module.exports = { createMediaStorage };
