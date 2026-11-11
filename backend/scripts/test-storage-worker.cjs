// Test the built Worker with a fixture provider. No cloud credentials or network calls.
const { Miniflare, Response, convertV4MiniflareOptions } = require('miniflare');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const objects = new Map();
const prefix = '/storage/v1/object/';
const bucket = 'booking-references';
const fixture = new Miniflare(convertV4MiniflareOptions({workers:[{
  modulesRoot: join(__dirname,'../dist'), modules: [{type:'ESModule',path:join(__dirname,'../dist/worker.js')}],
  compatibilityDate:'2026-11-10', compatibilityFlags:['nodejs_compat'],
  bindings:{SUPABASE_URL:'https://fixture.supabase.co', SUPABASE_SECRET_KEY:'sb_secret_fixture', SUPABASE_STORAGE_BUCKET:bucket},
  async outboundService(request) {
    const url = new URL(request.url);
    assert.equal(url.host,'fixture.supabase.co');
    assert.equal(request.headers.get('apikey'),'sb_secret_fixture');
    assert.ok(url.pathname.startsWith(prefix));
    const key=url.pathname.slice(prefix.length).replace(/^(?:info|authenticated)\//,'');
    assert.ok(key.startsWith(`${bucket}/references/`));
    if(request.method==='POST') {
      const bytes=await request.arrayBuffer();
      assert.equal(Number(request.headers.get('content-length')),bytes.byteLength);
      objects.set(key,bytes);
      return Response.json({Key:key});
    }
    if(request.method==='DELETE') {objects.delete(key); return Response.json({});}
    if(request.method==='GET' && objects.has(key)) return new Response(objects.get(key));
    return new Response(null,{status:404});
  },
}]}));

async function run() {
  assert.equal((await fixture.dispatchFetch('http://localhost/internal/cleanup', { method: 'POST' })).status, 404);
  const bytes = Buffer.alloc(192 * 1024, 82);
  bytes.write('RIFF');
  bytes.write('WEBP', 8);
  const send = (size, type = 'image/webp', payload = bytes) => {
    const body = Buffer.concat([
      Buffer.from(`--fixture\r\nContent-Disposition: form-data; name="file"; filename="reference"\r\nContent-Type: ${type}\r\n\r\n`),
      payload,
      Buffer.from('\r\n--fixture--\r\n'),
    ]);
    return fixture.dispatchFetch('http://localhost/api/uploads', {
      method:'POST', body, headers:{'Content-Type':'multipart/form-data; boundary=fixture','X-File-Size':String(size)},
    });
  };
  const upload=await send(bytes.length);
  assert.equal(upload.status,201,await upload.clone().text());
  const result=await upload.json();
  const downloaded=await fixture.dispatchFetch(result.url);
  assert.equal(downloaded.status,200);
  assert.equal(downloaded.headers.get('content-type'),'image/webp');
  assert.equal(downloaded.headers.get('cache-control'),'no-store');
  assert.equal(downloaded.headers.has('apikey'),false);
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
  const invalid=await send(bytes.length-1);
  assert.equal(invalid.status,413);
  assert.equal((await send(bytes.length + 1, 'image/webp', bytes.subarray(0, 12))).status, 413);
  const png = Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
  assert.equal((await send(png.length, 'image/png', png)).status, 415);
  assert.equal(objects.size,1);
  console.log('PASS workerd: 192 KiB WebP round-trip, size and type rejection, and cleanup');
}
run().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>fixture.dispose());
