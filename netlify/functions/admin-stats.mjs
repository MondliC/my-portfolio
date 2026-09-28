const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

async function verifyUser(url, anon, token) {
  const res = await fetch(url + "/auth/v1/user", {
    headers: { apikey: anon, Authorization: "Bearer " + token }
  });
  if (!res.ok) return null;
  return res.json();
}

function countBy(rows, fn) {
  const m = new Map();
  for (const r of rows) {
    const k = fn(r) || "Unknown";
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const url = Netlify.env.get("SUPABASE_URL");
  const anon = Netlify.env.get("SUPABASE_ANON_KEY");
  const service = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail = Netlify.env.get("ADMIN_EMAIL");
  if (!url || !anon || !service) return json({ error: "Supabase is not configured yet" }, 503);

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Authentication required" }, 401);

  const user = await verifyUser(url, anon, token);
  if (!user) return json({ error: "Authentication required" }, 401);
  if (adminEmail && String(user.email).toLowerCase() !== String(adminEmail).toLowerCase()) {
    return json({ error: "Not authorized" }, 403);
  }

  const requestUrl = new URL(req.url);
  const days = Math.max(1, Math.min(3650, Number(requestUrl.searchParams.get("days")) || 7));
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const q = new URL(url + "/rest/v1/analytics_events");
  q.searchParams.set("select", "created_at,event_type,session_id,page,referrer,device,active_seconds,scroll_depth,clicks");
  q.searchParams.set("created_at", "gte." + since);
  q.searchParams.set("order", "created_at.desc");
  q.searchParams.set("limit", "5000");

  const res = await fetch(q, {
    headers: { apikey: service, Authorization: "Bearer " + service }
  });
  if (!res.ok) return json({ error: "Analytics read failed" }, 500);
  const events = await res.json();

  const pageviews = events.filter(x => x.event_type === "pageview");
  const latestBySession = new Map();
  for (const e of events) if (!latestBySession.has(e.session_id)) latestBySession.set(e.session_id, e);
  const sessions = [...latestBySession.values()];
  const avg = (arr, fn) => arr.length
    ? Math.round(arr.reduce((a, x) => a + (Number(fn(x)) || 0), 0) / arr.length)
    : 0;

  const allClicks = [];
  for (const e of events) {
    for (const c of (Array.isArray(e.clicks) ? e.clicks : [])) {
      allClicks.push({ label: c.label || c.href || "Link" });
    }
  }

  return json({
    metrics: {
      unique_visitors: new Set(events.map(x => x.session_id)).size,
      pageviews: pageviews.length,
      avg_active_seconds: avg(sessions, x => x.active_seconds),
      avg_scroll_depth: avg(sessions, x => x.scroll_depth)
    },
    top_pages: countBy(pageviews, x => x.page).slice(0, 10),
    sources: countBy(sessions, x => x.referrer || "").slice(0, 10),
    devices: countBy(sessions, x => x.device || "unknown"),
    clicks: countBy(allClicks, x => x.label).slice(0, 10),
    sessions: sessions.slice(0, 50)
  });
};
