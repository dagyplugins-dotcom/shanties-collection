# Shanties Collection

Kenyan online store built with Next.js (App Router), Supabase (database, login, image storage) and Vercel.
Everything the owner changes (products, prices, banners, images, delivery fees, payment numbers) lives in Supabase, not in GitHub.

## What Step 1 includes
Database (all tables, security rules, image storage buckets, your categories), customer register/login/reset password,
brand design system, header + mobile bottom nav, homepage with swipeable banner slider, categories, product listing with
filters/sort/pagination, product pages with swipeable gallery, search with suggestions, basic cart, SEO (sitemap, robots, product data).

Coming next: Step 2 checkout, delivery fees and M-Pesa. Step 3 orders, wishlist, reviews. Step 4 admin dashboard. Step 5 hardening.

## Setup (about 15 minutes)

### 1. Create the Supabase project
1. supabase.com > New project (pick the region closest to Kenya, e.g. Europe/Frankfurt or the nearest available). Save the database password.
2. Open **SQL Editor > New query**, paste all of `supabase/schema.sql`, press **Run**.
3. Optional: run `supabase/demo-products.sql` to see sample products.
4. **Project Settings > API**: copy the Project URL, the `anon` public key and the `service_role` key.
5. **Authentication > URL Configuration**: set Site URL to your website address and add `https://YOUR-SITE/auth/callback` to Redirect URLs.

### 2. Put the code on GitHub and deploy on Vercel
```
git init
git add .
git commit -m "Shanties Collection step 1"
git branch -M main
git remote add origin https://github.com/YOUR-USER/shanties-collection.git
git push -u origin main
```
In Vercel: Add New > Project > import the repo, then add these **Environment Variables** before deploying:

| Name | Value |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | anon public key |
| SUPABASE_SERVICE_ROLE_KEY | service_role key (secret, never share) |
| NEXT_PUBLIC_SITE_URL | https://your-site.vercel.app (or your domain) |

### 3. Make yourself the admin
Register on the live site, then run this in the Supabase SQL Editor:
```
update public.profiles set role = 'admin' where email = 'YOUR-EMAIL@example.com';
```
(The admin dashboard itself arrives in Step 4.)

### Run locally
```
cp .env.example .env.local   # fill in the keys
npm install
npm run dev
```

## Notes
- Public pages refresh from the database every 60 seconds. Step 4 admin saves will refresh them instantly.
- Registration uses email plus a Kenyan phone number. Supabase email confirmation is on by default; for testing you can turn it off under Authentication > Providers > Email.
- The footer info pages (About, Delivery, Returns, Privacy, Terms) contain starter text. Review them and adapt to your business.
- Never put M-Pesa secrets or the service_role key in any `NEXT_PUBLIC_` variable.
