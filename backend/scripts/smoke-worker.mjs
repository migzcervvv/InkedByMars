import assert from 'node:assert/strict';
const base=process.env.TEST_WORKER_ORIGIN || 'http://127.0.0.1:8787';
const headers=process.env.TEST_FRONTEND_ORIGIN ? {Origin:process.env.TEST_FRONTEND_ORIGIN} : {};
assert.equal((await fetch(base+'/api/health')).status,200);
assert.equal((await fetch(base+'/api/health',{headers:{Origin:'https://not-allowed.example'}})).status,403);
// Synthetic image payload: tests byte preservation and streaming, not image decoding.
const bytes=new Uint8Array(192*1024);
bytes.set(new TextEncoder().encode('RIFF0000WEBP'));
for(let i=12;i<bytes.length;i++)bytes[i]=i%251;
const form=new FormData();form.append('file',new Blob([bytes],{type:'image/webp'}),'reference.webp');
const response=await fetch(base+'/api/uploads',{method:'POST',headers:{...headers,'X-File-Size':String(bytes.length)},body:form});
assert.equal(response.status,201,await response.clone().text());
const result=await response.json();assert.match(result.key,/^references\/[a-f0-9-]{36}\.webp$/);
const stored=await fetch(result.url);assert.equal(stored.status,200);assert.equal(stored.headers.get('content-type'),'image/webp');
assert.deepEqual(new Uint8Array(await stored.arrayBuffer()),bytes);
console.log('PASS 192 KiB WebP streams through the Worker and downloads byte-for-byte');
console.log(`Test object: ${result.key}`);
for(const [label,payload,declared] of [['bad signature',new Uint8Array(32),32],['wrong size',bytes,bytes.length-1],['empty upload',new Uint8Array(),0]]) {
 const body=new FormData();body.append('file',new Blob([payload],{type:'image/webp'}),'invalid.webp');
 const failed=await fetch(base+'/api/uploads',{method:'POST',headers:{...headers,'X-File-Size':String(declared)},body});
 assert.ok(failed.status>=400&&failed.status<500,`${label}: ${failed.status}`);
}
console.log('PASS invalid signature, length mismatch and empty uploads rejected');
