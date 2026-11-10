import assert from 'node:assert/strict';
const base=process.env.TEST_WORKER_ORIGIN || 'http://127.0.0.1:8787';
const headers={Origin:'http://localhost:5173'};
assert.equal((await fetch(base+'/api/health')).status,200);
assert.equal((await fetch(base+'/api/health',{headers:{Origin:'https://not-allowed.example'}})).status,403);
// Synthetic image payload: tests byte preservation and streaming, not image decoding.
const bytes=new Uint8Array(3*1024*1024+123);bytes.set([137,80,78,71,13,10,26,10]);
for(let i=8;i<bytes.length;i++)bytes[i]=i%251;
const form=new FormData();form.append('file',new Blob([bytes],{type:'image/png'}),'large.png');
const response=await fetch(base+'/api/uploads',{method:'POST',headers:{...headers,'X-File-Size':String(bytes.length)},body:form});
assert.equal(response.status,201,await response.clone().text());
const result=await response.json();assert.match(result.key,/^references\/[a-f0-9-]{36}\.png$/);
const stored=await fetch(result.url);assert.equal(stored.status,200);assert.equal(stored.headers.get('content-type'),'image/png');
assert.deepEqual(new Uint8Array(await stored.arrayBuffer()),bytes);
console.log('PASS real workerd: multipart >3 MB streams to local R2 and downloads byte-for-byte');
for(const [label,type,payload,declared] of [['bad signature','image/png',new Uint8Array(32),32],['wrong size','image/png',bytes,bytes.length-1],['empty upload','image/png',new Uint8Array(),0]]) {
 const body=new FormData();body.append('file',new Blob([payload],{type}),'invalid.png');
 const failed=await fetch(base+'/api/uploads',{method:'POST',headers:{...headers,'X-File-Size':String(declared)},body});
 assert.ok(failed.status>=400&&failed.status<500,`${label}: ${failed.status}`);
}
console.log('PASS invalid signature, length mismatch and empty uploads rejected');
