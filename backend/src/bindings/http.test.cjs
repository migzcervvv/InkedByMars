const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('./http');
test('transport uses the Workers-supported manual redirect mode and preserves JSON responses',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(options.redirect,'manual');assert.equal(options.headers.Authorization,'Bearer fixture-token');
  assert.equal(new URL(url).searchParams.get('fields'),'id,username');
  return Response.json({id:'fixture'});
 });
 assert.equal((await http.get('https://graph.facebook.com/v25.0/123',{headers:{Authorization:'Bearer fixture-token'},params:{fields:'id,username'}})).data.id,'fixture');
});
test('redirects are rejected without following the location or forwarding credentials',async t=>{
 const fetch=t.mock.method(globalThis,'fetch',async()=>new Response(null,{status:302,headers:{Location:'https://other.example/'}}));
 await assert.rejects(http.get('https://graph.facebook.com/v25.0/123'),{code:'UPSTREAM_REDIRECT',upstreamStatus:302,response:{status:502,data:null}});
 assert.equal(fetch.mock.callCount(),1);
});
test('non-JSON failures retain the HTTP status instead of becoming status:null',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('unavailable',{status:503}));
 await assert.rejects(http.get('https://graph.facebook.com/v25.0/123'),{code:'UPSTREAM_INVALID_JSON',upstreamStatus:503,response:{status:503,data:null}});
});
