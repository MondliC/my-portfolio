# MN Cloud Consulting

Microsoft cloud security consulting website and lightweight CMS.

## Live
Hosted from this repository through Netlify at:
`/mn-cloud-consulting/`

## Stack
- HTML / CSS / JavaScript
- Netlify Functions
- Supabase Postgres + Auth
- RLS enabled on all MNCC tables

## Admin
`/mn-cloud-consulting/admin.html`

Admin writes are handled server-side. The Supabase service-role key is never exposed in browser code.

## Database
Schema is stored in `supabase/schema.sql`.

Tables:
- `mncc_services`
- `mncc_cases`
- `mncc_settings`
- `mncc_leads`

## Functions
- `mncc-content.mjs`
- `mncc-contact.mjs`
- `mncc-admin-auth.mjs`
- `mncc-admin.mjs`
