require('dotenv').config();
const mongoose=require('mongoose');
// Explicit opt-in utility. No database mutation occurs without --apply.
(async()=>{
 if(!process.env.MONGO_URI)throw new Error('MONGO_URI is required.');
 const apply=process.argv.includes('--apply');
 await mongoose.connect(process.env.MONGO_URI);
 const bookings=mongoose.connection.db.collection('bookings');
 let candidates=0,converted=0;
 for await(const booking of bookings.find({'referenceImages.0':{$exists:true}})) {
  if(booking.referenceImages.every(value=>typeof value==='string'&&value.startsWith('references/')))continue;
  candidates++;
  if(!apply)continue;
  if(!process.env.MIGRATION_API_ORIGIN)throw new Error('MIGRATION_API_ORIGIN is required for --apply.');
  const keys=[];
  for(const item of booking.referenceImages) {
   if(typeof item==='string'&&item.startsWith('references/')){keys.push(item);continue;}
   const source=typeof item==='string'?item:item.url;
   const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(source||'');
   if(!match)throw new Error('Legacy external URL or unsupported reference found. Review manually; no arbitrary URL is fetched.');
   const bytes=Buffer.from(match[2],'base64');const form=new FormData();form.append('file',new Blob([bytes],{type:match[1]}),'legacy-reference');
   const response=await fetch(process.env.MIGRATION_API_ORIGIN+'/api/uploads',{method:'POST',headers:{'X-File-Size':String(bytes.length)},body:form});
   if(!response.ok)throw new Error('Upload rejected. Retry after checking the Worker and upload rate limit.');
   keys.push((await response.json()).key);
  }
  const result=await bookings.updateOne({_id:booking._id,referenceImages:booking.referenceImages},{$set:{referenceImages:keys}});
  if(result.modifiedCount!==1)throw new Error('Booking changed concurrently; replacement was not applied.');
  converted++;
 }
 console.log(JSON.stringify({mode:apply?'apply':'dry-run',candidates,converted}));
})().catch(error=>{console.error(error.message.includes('required')||error.message.startsWith('Legacy')||error.message.startsWith('Upload')||error.message.startsWith('Booking')?error.message:'Migration failed. Check database connectivity.');process.exitCode=1;}).finally(()=>mongoose.disconnect());
