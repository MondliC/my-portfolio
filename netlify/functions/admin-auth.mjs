const json = (statusCode, body) => ({
  statusCode,
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify(body)
});

export async function handler(event){
  if(event.httpMethod !== 'POST') return json(405,{error:'Method not allowed'});
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if(!url || !anon) return json(503,{error:'Supabase is not configured yet'});

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400,{error:'Invalid JSON'}); }

  const res = await fetch(url + '/auth/v1/token?grant_type=password', {
    method:'POST',
    headers:{apikey:anon,'Content-Type':'application/json'},
    body:JSON.stringify({email:body.email,password:body.password})
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) return json(401,{error:data.error_description || data.msg || 'Invalid login'});

  return json(200,{
    access_token:data.access_token,
    expires_in:data.expires_in,
    token_type:data.token_type,
    user:{id:data.user?.id,email:data.user?.email}
  });
}