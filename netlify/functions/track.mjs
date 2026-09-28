const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Netlify.env.get("SUPABASE_URL");
  const key = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Analytics not configured" }, 503);

  let p;
  try { p = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  const row = {
    event_type: String(p.type || "pageview").slice(0, 40),
    session_id: String(p.session_id || "").slice(0, 80),
    page: String(p.page || "/").slice(0, 300),
    title: String(p.title || "").slice(0, 300),
    referrer: String(p.referrer || "").slice(0, 600),
    referral_source: String(p.referral_source || "").slice(0, 120),
    utm_source: String(p.utm_source || "").slice(0, 120),
    country: String(context?.geo?.country?.name || "").slice(0, 120),
    device: String(p.device || "unknown").slice(0, 30),
    active_seconds: Math.max(0, Math.min(86400, Number(p.active_seconds) || 0)),
    scroll_depth: Math.max(0, Math.min(100, Number(p.scroll_depth) || 0)),
    clicks: Array.isArray(p.clicks) ? p.clicks.slice(0, 20) : [],
    timezone: String(p.timezone || "").slice(0, 80),
    language: String(p.language || "").slice(0, 40),
    screen: String(p.screen || "").slice(0, 30)
  };

  if (!row.session_id) return json({ error: "Missing session" }, 400);

  const res = await fetch(url + "/rest/v1/analytics_events", {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(row)
  });

  if (!res.ok) return json({ error: "Analytics write failed" }, 500);
  return json({ ok: true });
};
