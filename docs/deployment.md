# Deployment Guide

## Platform: Vercel

OtterBeer's app deploys on **Vercel**, with images and the database hosted externally:
- Next.js app → Vercel Serverless / Edge Functions
- Images → Cloudinary
- Database → MongoDB Atlas (external, always-on)

---

## Required Services

| Service | Plan | Purpose |
|---|---|---|
| [Vercel](https://vercel.com) | Hobby or Pro | Hosting, serverless |
| [MongoDB Atlas](https://www.mongodb.com/atlas) | M0 Free / M10 Paid | Database |
| [Cloudinary](https://cloudinary.com) | Pay-as-you-go | Image storage |
| [Google Cloud Console](https://console.cloud.google.com) | Free | OAuth credentials |

---

## First Deployment

### 1. Push your repository to GitHub

```bash
git add .
git commit -m "chore: initial project setup"
git push origin main
```

### 2. Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Leave build settings as default (`next build`)

### 3. Set up Cloudinary

1. Cloudinary dashboard → **Settings** → **Access Keys**
2. Note the Cloud Name, API Key, and API Secret.
3. Go to **Settings** → **Upload** → **Upload presets** → Add a new preset.
4. Set it to **Signed** mode.
5. Turn off "Unique filename" (our object keys are already unique UUIDs).

### 4. Configure Environment Variables

In Vercel project → **Settings** → **Environment Variables**, add:

`MONGODB_URI` must use **different values per Vercel environment** — Preview and Production should never share a database (see [database-schema.md](./database-schema.md#per-environment-database--storage)). Use Vercel's per-variable environment picker:

| Variable | Environment | Value |
|---|---|---|
| `MONGODB_URI` | Production | Your **prod** Atlas connection string |
| `MONGODB_URI` | Preview, Development | Your **dev** Atlas connection string |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` / `CLOUDINARY_UPLOAD_PRESET` | All | From Cloudinary dashboard |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://otterbeer.vn` |
| `NEXT_PUBLIC_SITE_URL` | Preview | Auto set by Vercel (leave blank, or `https://otter-beer.vercel.app`) |
| `AUTH_SECRET` | All | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | All | From Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | All | From Google Cloud Console |
| `FIRST_SUPER_ADMIN_EMAIL` | Production (temporarily) | Your Google account email — see step 7 |

### 5. Add Google OAuth redirect URIs

In Google Cloud Console → Your OAuth App → Authorized redirect URIs:
```
https://otterbeer.vn/api/auth/callback/google
https://otter-beer.vercel.app/api/auth/callback/google  ← preview URL
```

### 6. Custom Domain

1. Vercel project → **Domains** → Add `otterbeer.vn`
2. Update your DNS:
   - `A` record: `76.76.19.61` (Vercel IP)
   - or `CNAME`: `cname.vercel-dns.com`
3. SSL is automatic via Let's Encrypt

### 7. Seed roles + create the first superAdmin

1. Fill in `.env.production.local` locally with the same prod `MONGODB_URI` you set in Vercel, then run `pnpm run seed:prod` — creates the three system roles and their default permission matrix in the **production** database. (Never run plain `pnpm run seed` for this step — that targets `.env.development.local`.)
2. With `FIRST_SUPER_ADMIN_EMAIL` set (step 4), sign in once at `https://otterbeer.vn/admin/dang-nhap` with that Google account — this creates you as `super_admin`.
3. Remove `FIRST_SUPER_ADMIN_EMAIL` from the Vercel environment variables afterward. See [authentication.md](./authentication.md#adding-the-first-admin-user).

---

## MongoDB Atlas Configuration

### Network Access
Add Vercel's IP ranges or use `0.0.0.0/0` (allow all — acceptable if DB credentials are strong):

1. Atlas → **Network Access** → **Add IP Address**
2. Enter `0.0.0.0/0` for simplicity, or add [Vercel's static IPs](https://vercel.com/docs/security/deployment-protection/methods-to-protect-deployments/vercel-authentication)

### Database User
1. Atlas → **Database Access** → **Add New Database User**
2. Role: **readWrite** on `otter-beer` database only
3. Copy username + password into `MONGODB_URI`

---

## Deployment Branches

| Branch | Vercel Environment | URL |
|---|---|---|
| `main` | Production | `https://otterbeer.vn` |
| `dev` | Preview | `https://otter-beer-git-dev-*.vercel.app` |
| Feature branches | Preview | Auto-generated URL |

---

## Continuous Deployment

Every push to `main` triggers an automatic production deployment.
Every pull request gets its own preview URL — share with the team for review before merging.

---

## Monitoring & Logs

- **Build logs**: Vercel dashboard → Deployments → Select build
- **Function logs**: Vercel dashboard → Logs (real-time and historical)
- **Error tracking**: Consider adding [Sentry](https://sentry.io) (`@sentry/nextjs`) for production error monitoring

---

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel dashboard
- [ ] `NEXT_PUBLIC_SITE_URL` set to `https://otterbeer.vn`
- [ ] Google OAuth redirect URIs include production domain
- [ ] MongoDB Atlas network access configured
- [ ] Cloudinary project created and keys provided
- [ ] `pnpm run seed` run against production DB; first `super_admin` created via sign-in (see step 7)
- [ ] Custom domain configured and SSL verified
- [ ] Test sitemap at `https://otterbeer.vn/sitemap.xml`
- [ ] Test 404 page at `https://otterbeer.vn/does-not-exist`
- [ ] Submit sitemap to [Google Search Console](https://search.google.com/search-console)
- [ ] Submit sitemap to [Bing Webmaster Tools](https://www.bing.com/webmasters)
