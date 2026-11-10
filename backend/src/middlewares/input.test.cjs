const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Hono}=require('hono');
const {input,validate}=require('./input');
const {createBookingValidators}=require('../validators/bookingValidators');
const {requireAdmin,requireSuperAdmin}=require('./workerAuth');
function app(){const api=new Hono();api.onError((error,c)=>c.json({code:error.code,message:error.message},error.statusCode||500));api.use('*',input);return api;}
test('mounted availability routes validate the matched date rather than the global middleware snapshot',async()=>{
 const api=app(),child=new Hono();
 const {dateParamValidator}=require('../validators/scheduleValidators');
 child.get('/public/availability/:date',validate(dateParamValidator),c=>c.json({date:c.get('input').params.date}));
 api.route('/api',child);
 const response=await api.request('/api/public/availability/2026-11-10');
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{date:'2026-11-10'});
 assert.equal((await api.request('/api/public/availability/not-a-date')).status,400);
});
test('matched MongoDB ID parameters also survive mounted route validation',async()=>{
 const api=app(),child=new Hono();
 const {mongoIdParam}=require('../validators/bookingValidators');
 child.get('/bookings/:id',validate(mongoIdParam),c=>c.json({id:c.get('input').params.id}));
 api.route('/api',child);
 const id='507f1f77bcf86cd799439011';
 assert.equal((await api.request(`/api/bookings/${id}`)).status,200);
 assert.equal((await api.request('/api/bookings/invalid')).status,400);
});
test('native Hono validation rejects inline media and accepts R2 key strings',async()=>{const api=app();api.post('/booking',validate(createBookingValidators),c=>c.json(c.get('input').body));const body={clientName:'Fixture',email:'fixture@example.com',phone:'123',instagramHandle:'@fixture',tattooPlacement:'Arm',preferredDate:'2099-12-01',preferredTime:'15:00',referenceImages:['references/12345678-1234-1234-1234-123456789abc.png']};let response=await api.request('/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200);body.referenceImages=[{url:'data:image/png;base64,AAAA'}];response=await api.request('/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,400);});
test('oversized JSON is rejected before controller execution',async()=>{const api=app();api.post('/',c=>c.json({wrong:true}));const response=await api.request('/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({large:'a'.repeat(65536)})});assert.equal(response.status,413);});
test('administrator endpoints fail closed without credentials',async()=>{for(const chain of[requireAdmin,requireSuperAdmin]){const api=app();api.get('/protected',...chain,c=>c.json({wrong:true}));assert.equal((await api.request('/protected')).status,401);}});
test('booking schema contains only string references and rejects binary/data URLs',async()=>{const Booking=require('../models/Booking');const record=new Booking({clientName:'Fixture',email:'fixture@example.com',phone:'123',instagramHandle:'fixture',tattooPlacement:'Arm',preferredDate:'2099-12-01',preferredTime:'15:00',referenceImages:['data:image/png;base64,AAAA']});await assert.rejects(record.validate());record.referenceImages=['references/12345678-1234-1234-1234-123456789abc.png'];await record.validate();assert.equal(typeof record.referenceImages[0],'string');});
