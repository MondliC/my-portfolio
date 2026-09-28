# Portfolio Analytics Admin Setup

The admin dashboard is available at `/admin.html`.

## 1. Create a Supabase project
Create a project at Supabase, then open **SQL Editor** and run the contents of `supabase-schema.sql`.

## 2. Create the admin user
In Supabase: **Authentication → Users → Add user**.
Use the email/password you want to use for the private dashboard.

## 3. Add Netlify environment variables
In Netlify: **Site configuration → Environment variables**.

Add:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL` — your Supabase admin user's email

Never put the service-role key into frontend JavaScript.

## 4. Redeploy
Trigger a new Netlify deployment after adding the environment variables.

## What is tracked
- Session ID (random browser-session identifier)
- Page and title
- Referrer/source
- Device type
- Active time
- Maximum scroll depth
- Clicked link labels/targets
- Browser language, timezone and screen size

Raw IP addresses are not stored by this implementation.

## Privacy
If you expand tracking later, update your portfolio privacy notice and comply with applicable privacy laws such as POPIA/GDPR.
