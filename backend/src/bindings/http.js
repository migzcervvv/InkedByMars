async function request(method, url, data, options = {}) {
  const target = new URL(url);
  for (const [name,value] of Object.entries(options.params || {})) if (value !== undefined && value !== null) target.searchParams.set(name,String(value));
  // Workers supports follow/manual, but rejects redirect:error before any I/O.
  // Never follow redirects carrying bearer tokens, app secrets or API keys.
  const response = await fetch(target, { method, headers: { ...(data ? {'Content-Type':'application/json'} : {}), ...options.headers }, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(options.timeout || 10000), redirect: 'manual' });
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel();
    const error = new Error('External HTTP service returned a blocked redirect.');
    error.code='UPSTREAM_REDIRECT'; error.response={status:502,data:null};error.upstreamStatus=response.status;
    throw error;
  }
  let parsed;
  try { parsed = await response.json(); }
  catch {
    const error=new Error('External HTTP service returned a non-JSON response.');
    error.code='UPSTREAM_INVALID_JSON'; error.response={status:response.ok ? 502 : response.status,data:null};error.upstreamStatus=response.status;
    throw error;
  }
  const result = { status: response.status, headers: Object.fromEntries(response.headers), data: parsed };
  if (!response.ok) { const error = new Error('External HTTP service rejected the request.'); error.response=result; throw error; }
  return result;
}
exports.get = (url, options) => request('GET',url,null,options);
exports.post = (url, data, options) => request('POST',url,data,options);
