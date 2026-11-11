const Busboy = require('busboy');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const AppError = require('../utils/AppError');
const TYPES = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' };
const BOOKING_UPLOAD_LIMIT = 192 * 1024;
exports.isMediaKey = key => typeof key === 'string' && /^references\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key);
exports.mediaUrl = (key, origin) => `${origin.replace(/\/$/,'')}/media/${key.slice('references/'.length)}`;
const signatureMatches = (bytes,type) => type === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : type === 'image/jpeg' ? bytes[0]===255&&bytes[1]===216&&bytes[2]===255 : bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
exports.imageExtension = (bytes, type) => TYPES[type] && bytes.length >= 12 && signatureMatches(bytes, type) ? TYPES[type] : null;

async function streamUpload(request, bucket, declaredSize, maxBytes = 20 * 1024 * 1024, makeFixedLength = length => new FixedLengthStream(length), allowedTypes = Object.keys(TYPES)) {
  if (!Number.isSafeInteger(declaredSize) || declaredSize < 12 || declaredSize > maxBytes) {
    throw new AppError(`X-File-Size must match the file size. The maximum is ${maxBytes} bytes.`, 413, 'UPLOAD_SIZE');
  }
  if (!request.body) throw new AppError('Missing upload body.',400);
  let parser;
  try { parser=Busboy({headers:Object.fromEntries(request.headers),limits:{files:1,fields:0,parts:2,fileSize:maxBytes+1,headerPairs:30}}); }
  catch { throw new AppError('Expected multipart/form-data with a boundary.',400); }
  let key, fileTask, failure, seen=false;
  const reject = error => { failure ||= error; };
  parser.on('filesLimit',()=>reject(new AppError('Upload one file at a time.',400)));
  parser.on('fieldsLimit',()=>reject(new AppError('Only the file field is accepted.',400)));
  parser.on('partsLimit',()=>reject(new AppError('Upload one file at a time.',400)));
  parser.on('file',(field,file,info)=>{
    seen=true;
    if(field!=='file'||!allowedTypes.includes(info.mimeType)) {
      const message = allowedTypes.length === 1 ? 'Use a WebP image in the file field.' : 'Use a JPEG, PNG or WebP file in the file field.';
      reject(new AppError(message,415));file.resume();return;
    }
    key=`references/${crypto.randomUUID()}.${TYPES[info.mimeType]}`;
    file.on('limit',()=>reject(new AppError('Image exceeds the upload limit.',413)));
    fileTask=(async()=>{
      const fixed=makeFixedLength(declaredSize);
      let count=0,prefix=Buffer.alloc(0),verified=false;
      const source = Readable.toWeb(file);
      const checked = source.pipeThrough(new TransformStream({
        transform(chunk,controller) {
          count+=chunk.byteLength;
          if(count>declaredSize) throw new AppError('File size does not match X-File-Size.',413);
          if(!verified) {
            const needed=12-prefix.length,take=Math.min(needed,chunk.length);
            prefix=Buffer.concat([prefix,Buffer.from(chunk.subarray(0,take))]);
            if(prefix.length<12) return;
            if(!exports.imageExtension(prefix, info.mimeType)) throw new AppError('Image signature does not match its type.',415);
            verified=true;controller.enqueue(prefix);
            if(take<chunk.length)controller.enqueue(chunk.subarray(take));
          } else controller.enqueue(chunk);
        },
        flush(){if(!verified||count!==declaredSize)throw new AppError('Incomplete file or incorrect X-File-Size.',400);},
      }), { preventCancel: true });
      const abort = new AbortController();
      const pumping=checked.pipeTo(fixed.writable,{signal:abort.signal}).catch(error=>{abort.abort(error);throw error;});
      const storing=Promise.resolve().then(()=>bucket.put(key,fixed.readable,{contentType:info.mimeType,signal:abort.signal})).catch(error=>{abort.abort(error);throw error;});
      const results=await Promise.allSettled([pumping,storing]);
      for(const result of results)if(result.status==='rejected') {
        // Drain rejected parts without buffering, so multipart parsing can settle.
        await source.pipeTo(new WritableStream({write(){}})).catch(()=>{});
        throw result.reason;
      }
    })();
    fileTask.catch(reject);
  });
  try {
    let bodyBytes=0;
    const limited=request.body.pipeThrough(new TransformStream({transform(chunk,controller){bodyBytes+=chunk.byteLength;if(bodyBytes>maxBytes+16384)throw new AppError('Multipart body too large.',413);controller.enqueue(chunk);}}));
    await pipeline(Readable.fromWeb(limited),parser);
    if(fileTask)await fileTask;
    if(failure)throw failure;
    if(!seen||!key)throw new AppError('Missing image file.',400);
    return key;
  } catch(error) {
    if(fileTask)await fileTask.catch(()=>{});
    if(key)await bucket.delete(key).catch(()=>console.warn('Failed to clean up a rejected media upload.'));
    throw error instanceof AppError ? error : new AppError('Upload failed or multipart body is incomplete.',400,'UPLOAD_FAILED');
  }
}

exports.streamUpload = streamUpload;
exports.streamBookingUpload = (request, storage, declaredSize, makeFixedLength = length => new FixedLengthStream(length)) =>
  streamUpload(request, storage, declaredSize, BOOKING_UPLOAD_LIMIT, makeFixedLength, ['image/webp']);
