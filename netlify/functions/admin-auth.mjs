const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Netlify.env.get("SUPABASE_URL");
  const anon = Netlify.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return json({ error: "Supabase is not configured yet" }, 503);

  let body;
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  const res = await fetch(url + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: data.error_description || data.msg || "Invalid login" }, 401);

  return json({
    access_token: data.access_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    user: { id: data.user?.id, email: data.user?.email }
  });
};
