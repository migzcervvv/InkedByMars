const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMediaStorage } = require('./mediaStorage');
const env = {SUPABASE_URL:'https://testproject.supabase.co', SUPABASE_SECRET_KEY:'sb_secret_fixture', SUPABASE_STORAGE_BUCKET:'booking-references'};
const key = 'references/12345678-1234-1234-1234-123456789abc.png';

test('Supabase upload forwards the stream and private reads preserve the same key', async () => {
  const calls = [];
  const storage = createMediaStorage(env, async (url, options) => {
    calls.push([new URL(url).pathname, options.method]);
    assert.equal(options.headers.apikey, env.SUPABASE_SECRET_KEY);
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.redirect, 'manual');
    if (options.method === 'POST') {
      assert.ok(options.body instanceof ReadableStream);
      assert.equal(options.headers['x-upsert'], 'false');
      assert.equal(options.headers['Content-Type'], 'image/png');
      assert.equal((await new Response(options.body).arrayBuffer()).byteLength, 3 * 1024 * 1024);
    }
    return options.method === 'GET' ? new Response('stored') : new Response(null, {status:200});
  });
  await storage.put(key, new Blob([new Uint8Array(3 * 1024 * 1024)]).stream(), {contentType:'image/png'});
  assert.equal(await storage.head(key), true);
  assert.equal(await (await storage.get(key)).text(), 'stored');
  await storage.delete(key);
  const prefix='/storage/v1/object'; const path=`/${env.SUPABASE_STORAGE_BUCKET}/${key}`;
  assert.deepEqual(calls, [[prefix+path,'POST'],[prefix+'/info'+path,'HEAD'],[prefix+'/authenticated'+path,'GET'],[prefix+path,'DELETE']]);
});

test('missing objects differ from bad credentials, blocked redirects and missing config', async () => {
  const missing = createMediaStorage(env, async () => new Response(null,{status:404}));
  assert.equal(await missing.head(key),false);
  assert.equal(await missing.get(key),null);
  for(const status of [302,401,403,429,503]) {
    const storage = createMediaStorage(env, async () => new Response(null,{status}));
    await assert.rejects(storage.head(key), {statusCode:502,providerStatus:status});
  }
  assert.throws(()=>createMediaStorage({...env,SUPABASE_SECRET_KEY:'sb_publishable_fixture'}),{statusCode:503});
  assert.throws(()=>createMediaStorage({...env,SUPABASE_URL:'https://supabase.co.example.com'}),{statusCode:503});
});

test('retrying a deleted object succeeds, while a missing bucket retains the reference for retry', async () => {
  const absentObject = createMediaStorage(env, async () => Response.json({ code: 'NoSuchKey' }, { status: 404 }));
  await absentObject.delete(key);
  const absentBucket = createMediaStorage(env, async () => Response.json({ code: 'NoSuchBucket' }, { status: 404 }));
  await assert.rejects(absentBucket.delete(key), { statusCode: 502, providerStatus: 404 });
});
