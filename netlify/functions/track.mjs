const json = (statusCode, body) => ({
  statusCode,
  headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
  body: JSON.stringify(body)
});

export async function handler(event){
  if(event.httpMethod !== 'POST') return json(405,{error:'Method not allowed'});
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return json(503,{error:'Analytics not configured'});

  let p;
  try { p = JSON.parse(event.body || '{}'); } catch { return json(400,{error:'Invalid JSON'}); }

  const row = {
    event_type: String(p.type || 'pageview').slice(0,40),
    session_id: String(p.session_id || '').slice(0,80),
    page: String(p.page || '/').slice(0,300),
    title: String(p.title || '').slice(0,300),
    referrer: String(p.referrer || '').slice(0,600),
    device: String(p.device || 'unknown').slice(0,30),
    active_seconds: Math.max(0, Math.min(86400, Number(p.active_seconds)||0)),
    scroll_depth: Math.max(0, Math.min(100, Number(p.scroll_depth)||0)),
    clicks: Array.isArray(p.clicks) ? p.clicks.slice(0,20) : [],
    timezone: String(p.timezone || '').slice(0,80),
    language: String(p.language || '').slice(0,40),
    screen: String(p.screen || '').slice(0,30)
  };

  if(!row.session_id) return json(400,{error:'Missing session'});

  const res = await fetch(url + '/rest/v1/analytics_events', {
    method:'POST',
    headers:{
      apikey:key,
      Authorization:'Bearer ' + key,
      'Content-Type':'application/json',
      Prefer:'return=minimal'
    },
    body:JSON.stringify(row)
  });

  if(!res.ok) return json(500,{error:'Analytics write failed'});
  return json(200,{ok:true});
}