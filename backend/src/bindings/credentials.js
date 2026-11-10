const { current, env } = require('./runtime');
async function key() {
  const bytes=Buffer.from(env().TOKEN_ENCRYPTION_KEY,'base64');
  if(bytes.length!==32)throw new Error('TOKEN_ENCRYPTION_KEY must be 32 random bytes encoded as base64.');
  return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);
}
exports.load = async () => {
  if(!current()?.db || !env().TOKEN_ENCRYPTION_KEY)return null;
  const record=await current().db.collection('integrationCredentials').findOne({_id:'instagram'});
  if(!record)return null;
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(record.iv,'base64')},await key(),Buffer.from(record.encrypted,'base64'));
  return JSON.parse(new TextDecoder().decode(plain));
};
exports.save = async data => {
  if(!current()?.db || !env().TOKEN_ENCRYPTION_KEY)return;
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),new TextEncoder().encode(JSON.stringify(data)));
  await current().db.collection('integrationCredentials').updateOne({_id:'instagram'},{$set:{iv:Buffer.from(iv).toString('base64'),encrypted:Buffer.from(encrypted).toString('base64'),updatedAt:new Date()}},{upsert:true});
};
