# Convex Setup Guide

## Method 1: Get URL from Dashboard (Easiest)

1. Go to your Convex dashboard: https://dashboard.convex.dev
2. Select your "Rung app" project
3. Click on **Settings** or find the **Deployment URL**
4. Copy the URL (should be like `https://happy-animal-123.convex.cloud`)

5. Create `.env` file in project root:
   ```bash
   cd /home/user/rung-score-keep
   echo "EXPO_PUBLIC_CONVEX_URL=<paste-your-url-here>" > .env
   ```

6. Restart your Expo dev server:
   ```bash
   npm start
   ```

## Method 2: Run Convex Dev (Auto-configures)

1. In your project directory:
   ```bash
   cd /home/user/rung-score-keep
   npx convex dev
   ```

2. If prompted to login, it will open a browser (you're already logged in)

3. When asked to select a project, choose your existing "Rung app" project

4. This will create `.env.local` with the deployment URL

5. Copy the URL to `.env` for Expo:
   ```bash
   cat .env.local  # View the URL
   # Copy the CONVEX_DEPLOYMENT value
   echo "EXPO_PUBLIC_CONVEX_URL=<paste-url-here>" > .env
   ```

6. Keep `npx convex dev` running in a separate terminal (it watches for changes)

7. In another terminal, start Expo:
   ```bash
   npm start
   ```

## Verify Setup

Once configured, you can verify it's working:

1. Create a new game with QR code setup
2. You should see a QR code displayed
3. Scan it from your phone
4. Enter your name and emoji
5. You should successfully join the lobby!

## Troubleshooting

**"Game not found" error:**
- Make sure EXPO_PUBLIC_CONVEX_URL is set in `.env`
- Restart your Expo dev server after creating `.env`
- Make sure `npx convex dev` is running (for Method 2)

**Can't find deployment URL:**
- Dashboard → Your Project → Settings
- Look for "Deployment URL" or "Production Deployment"
