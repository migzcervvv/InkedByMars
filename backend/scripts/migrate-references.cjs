require('dotenv').config();
const mongoose=require('mongoose');
const { randomUUID } = require('node:crypto');
const { createMediaStorage } = require('../src/bindings/mediaStorage');
const { imageExtension } = require('../src/services/mediaService');
// Explicit opt-in utility. No database mutation occurs without --apply.
(async()=>{
 if(!process.env.MONGO_URI)throw new Error('MONGO_URI is required.');
 const apply=process.argv.includes('--apply');
 const storage = apply ? createMediaStorage(process.env) : null;
 await mongoose.connect(process.env.MONGO_URI);
 const bookings=mongoose.connection.db.collection('bookings');
 let candidates=0,converted=0;
 for await(const booking of bookings.find({'referenceImages.0':{$exists:true}})) {
  if(booking.referenceImages.every(value=>typeof value==='string'&&value.startsWith('references/')))continue;
  candidates++;
  if(!apply)continue;
  const keys=[];
  const uploaded = [];
  try {
   for(const item of booking.referenceImages) {
    if(typeof item==='string'&&item.startsWith('references/')){keys.push(item);continue;}
    const source=typeof item==='string'?item:item?.url;
    const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(source||'');
    if(!match)throw new Error('Legacy external URL or unsupported reference found. Review manually; no arbitrary URL is fetched.');
    const [, contentType, encoded] = match;
    const bytes = Buffer.from(encoded, 'base64');
    const extension = imageExtension(bytes, contentType);
    if (!extension) throw new Error('Legacy image bytes do not match their declared type.');
    const key = `references/${randomUUID()}.${extension}`;
    uploaded.push(key);
    await storage.put(key, bytes, { contentType });
    keys.push(key);
   }
  } catch (error) {
   await Promise.allSettled(uploaded.map(key => storage.delete(key)));
   throw error;
  }
  const result=await bookings.updateOne({_id:booking._id,referenceImages:booking.referenceImages},{$set:{referenceImages:keys}});
  if(result.modifiedCount!==1) {
   await Promise.allSettled(uploaded.map(key => storage.delete(key)));
   throw new Error('Booking changed concurrently; replacement was not applied.');
  }
  converted++;
 }
 console.log(JSON.stringify({mode:apply?'apply':'dry-run',candidates,converted}));
})().catch(error=>{console.error(error.code?.startsWith?.('MEDIA_')||error.code==='UPLOAD_SIZE'||error.message.includes('required')||error.message.startsWith('Legacy')||error.message.startsWith('Booking')?error.message:'Migration failed. Check database connectivity.');process.exitCode=1;}).finally(()=>mongoose.disconnect());
