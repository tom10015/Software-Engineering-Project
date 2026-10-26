# Saint Leo Campus Event Scheduling System
Student project website using GitHub Pages and a Supabase-hosted database.

## Features
- Public calendar for approved campus events
- Student sign-in and event request submission
- My Requests page section to track approvals
- Administrator portal for approving or rejecting event requests
- Real persistent shared database, with server-side room capacity and double-booking checks
- Tapia 208 room and Saint Leo-inspired green/gold theme

## Setup (required for real saving)
GitHub Pages only hosts the front end. You also need a Supabase project for logins and data.

1. Create a Supabase project at https://supabase.com/dashboard.
2. Paste the contents of `schema.sql` into its **SQL Editor** and run it in a new database.
3. Under project API settings, copy the **Project URL** and **public publishable/anon key**.
4. Edit `config.js` with those two values. **Never use a secret or service_role key.**
5. In Supabase Authentication > URL Configuration, set the Site URL to `https://tom10015.github.io/Software-Engineering-Project/`. If email confirmation is on, add the same URL to redirects.
6. Enable GitHub Pages for this repository: Settings > Pages > Deploy from a branch > main > /(root).
7. Register a user account on the website, and confirm your email if requested.
8. To make your account an admin, run this in Supabase SQL Editor, replacing the email:
   `update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL@example.com');`
9. Sign out and sign back in, then test the administrator portal.

## Testing
Create a student reservation; approve it as admin; confirm that it appears on the calendar.
Then create another overlapping reservation for the same room/date/time; the database must reject approval.

## Notes
Do not collect real private student information. This is an unofficial academic prototype, not an approved Saint Leo University application. The website has not been integrated with university authentication. No automated CI workflows are configured yet.
