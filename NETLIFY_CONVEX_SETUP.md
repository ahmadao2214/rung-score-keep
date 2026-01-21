# Netlify + Convex Deployment Setup

This guide will help you set up automatic Convex deployment when building on Netlify.

## Problem

The current setup has stub API files that prevent crashes but won't actually work for multiplayer. You need to deploy your Convex functions during the Netlify build.

## Solution: Convex Deploy Key

### Step 1: Generate a Convex Deploy Key

1. Go to your Convex dashboard: https://dashboard.convex.dev
2. Select your "Rung app" project
3. Click on **Settings**
4. Scroll to **Deploy keys**
5. Click **Generate a deploy key**
6. Copy the deploy key (it looks like: `prod:your-project-12345|abcdef...`)

###Step 2: Add Deploy Key to Netlify

1. Go to your Netlify dashboard
2. Select your "rung-score-keep" site
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. Add:
   - **Key**: `CONVEX_DEPLOY_KEY`
   - **Value**: `<paste the deploy key from step 1>`
   - **Scopes**: Check all (Production, Deploy previews, Branch deploys)
6. Click **Save**

### Step 3: Update Build Command

The build command in `netlify.toml` should be:

```toml
[build]
  command = "npx convex deploy --cmd 'npm run build:web'"
  publish = "dist"
```

This will:
1. Deploy your Convex schema and functions
2. Generate the real API files (replacing stubs)
3. Build your Expo web app with the real Convex functions

### Step 4: Redeploy

1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Clear cache and deploy site**

## How It Works

When Netlify builds your site:

1. It reads `CONVEX_DEPLOY_KEY` from environment variables
2. Runs `npx convex deploy` which:
   - Authenticates using the deploy key
   - Pushes your schema and functions to Convex
   - Generates real API files in `convex/_generated/`
3. Runs `npm run build:web` with the real Convex API
4. Your deployed site now has full Convex multiplayer support!

## Verification

After deployment, test the QR code flow:

1. Open your Netlify site
2. Create a new game with QR code
3. Scan from your phone
4. You should be able to join successfully!

## Troubleshooting

**"Deploy key not found" error:**
- Make sure `CONVEX_DEPLOY_KEY` is set correctly in Netlify
- The key should start with `prod:` for production deployments

**Build still fails:**
- Check Netlify build logs for specific errors
- Make sure all Convex functions are properly defined in your schema

**Game still not found:**
- Check that `EXPO_PUBLIC_CONVEX_URL` is also set in Netlify
- Both environment variables are required
