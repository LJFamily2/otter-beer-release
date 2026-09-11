# OtterBeer Handover Guide

Welcome to the OtterBeer project! This guide will walk you through setting up the project locally, configuring required third-party services, and deploying the application.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **pnpm** (Package manager, `npm install -g pnpm`)
- **Git**

## 1. Local Setup

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd otter-beer
pnpm install
```

## 2. Third-Party Services Setup

You will need to register for the following services (free tiers are sufficient for getting started).

### MongoDB (Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create an account.
2. Create a new Cluster (the free M0 tier works fine).
3. Under **Database Access**, create a user with `readWrite` permissions.
4. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
5. Copy your connection string (it looks like `mongodb+srv://<username>:<password>@cluster0...`).

### Cloudinary (Image Storage)
1. Go to [Cloudinary](https://cloudinary.com/) and create an account.
2. On your dashboard, note down your **Cloud Name**, **API Key**, and **API Secret**.
3. Go to **Settings** -> **Upload** -> **Upload presets**.
4. Add a new preset, set its mode to **Signed**, and turn off "Unique filename". Note the name of this preset.

### Google Cloud Console (Authentication)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Go to **APIs & Services** -> **Credentials**.
4. Create an **OAuth 2.0 Client ID** (Web application).
5. Set the Authorized Redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://<your-domain>/api/auth/callback/google`
6. Note down the **Client ID** and **Client Secret**.

## 3. Environment Variables

Copy `.env.example` to create your local `.env.local` file:

```bash
cp .env.example .env.local
```

Fill out the variables in `.env.local` using the credentials you gathered above:
- `MONGODB_URI`: Your MongoDB connection string.
- `AUTH_SECRET`: Generate one by running `openssl rand -base64 32`.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`: From Google Cloud.
- `FIRST_SUPER_ADMIN_EMAIL`: Your personal Google account email (used for initial admin setup).
- `CLOUDINARY_*`: From your Cloudinary dashboard.

## 4. Run Locally

Once your `.env.local` is ready, seed the database and start the development server:

```bash
# Seed default roles and admin config
pnpm run seed

# Start the dev server
pnpm dev
```

Visit `http://localhost:3000` to view the site, and `http://localhost:3000/admin` to access the admin panel. Your first login with the email specified in `FIRST_SUPER_ADMIN_EMAIL` will automatically grant you Super Admin rights.

## 5. Deployment

The project is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. In the Vercel dashboard, add all the environment variables from your `.env.local`.
   - *Note: Make sure to set `NEXT_PUBLIC_SITE_URL` to your production domain.*
4. Deploy!

For more detailed information, please review the documentation in the `docs/` folder, especially `docs/architecture.md`, `docs/security.md`, and `docs/deployment.md`.
