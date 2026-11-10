import { streamUpload, isMediaKey, mediaUrl } from '../services/mediaService';
export async function upload(c) {
  const ip=c.req.header('CF-Connecting-IP') || 'local';
  if(c.env.UPLOAD_LIMITER && !(await c.env.UPLOAD_LIMITER.limit({key:ip})).success) return c.json({success:false,message:'Too many uploads. Try again later.'},429);
  const key=await streamUpload(c.req.raw,c.env.MEDIA,Number(c.req.header('X-File-Size')));
  return c.json({success:true,key,url:mediaUrl(key,c.env.PUBLIC_MEDIA_BASE_URL || new URL(c.req.url).origin)},201);
}
export async function readMedia(c) {
  const key=`references/${c.req.param('id')}`;
  if(!isMediaKey(key))return c.notFound();
  const object=await c.env.MEDIA.get(key);
  if(!object)return c.notFound();
  const headers=new Headers(); object.writeHttpMetadata(headers);
  headers.set('ETag',object.httpEtag);headers.set('X-Content-Type-Options','nosniff');
  return new Response(object.body,{headers});
}
