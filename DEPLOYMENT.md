# Deployment Guide

This guide covers deploying the Rung Score Keeper app to Netlify.

## Prerequisites

- Node.js 20+ installed
- Netlify account (free tier works)
- Git repository pushed to GitHub

## Method 1: Deploy via Netlify Dashboard (Recommended)

1. **Connect Repository**
   - Log in to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account
   - Select the `rung-score-keep` repository

2. **Configure Build Settings**
   - **Build command**: `npm run build:web`
   - **Publish directory**: `dist`
   - **Node version**: 20 (automatically detected from `.nvmrc`)

3. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your app
   - You'll get a URL like `https://random-name.netlify.app`

4. **Custom Domain (Optional)**
   - Go to Site settings → Domain management
   - Add your custom domain

## Method 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Build the App**
   ```bash
   npm run build:web
   ```

4. **Deploy**
   ```bash
   # For draft deployment
   netlify deploy

   # For production deployment
   netlify deploy --prod
   ```

5. **Follow prompts**
   - Choose "Create & configure a new site" or select existing site
   - Publish directory: `dist`

## Configuration Files

The repository includes:

- **`netlify.toml`**: Build configuration
  - Build command: `npm run build:web`
  - Publish directory: `dist`
  - SPA redirect rules (/* → /index.html)
  - Node version: 20

- **`.nvmrc`**: Node version specification (20)

- **`.npmrc`**: npm configuration for legacy peer dependencies

## Environment Variables

If you integrate Convex backend later:

1. In Netlify Dashboard, go to Site settings → Environment variables
2. Add:
   ```
   EXPO_PUBLIC_CONVEX_URL=<your-convex-url>
   ```

## Build Settings

The build uses:
- **Framework**: Expo (React Native Web)
- **Build command**: `npm run build:web`
- **Output**: Static HTML/JS/CSS in `dist/`
- **Node version**: 20

## Continuous Deployment

Once connected to GitHub, Netlify will automatically:
- Deploy on every push to the main branch
- Create preview deployments for pull requests
- Run the build command and deploy to CDN

## Troubleshooting

### Build fails with "Module not found"
- Ensure all dependencies are in `package.json`
- Try: `rm -rf node_modules package-lock.json && npm install`

### App shows blank screen
- Check browser console for errors
- Verify all imports are correct
- Ensure Tamagui config is properly set up

### Routing doesn't work (404 on refresh)
- Verify `netlify.toml` has the redirect rule
- Check that `dist/_redirects` file exists after build

## Performance Optimization

For better performance:
1. Enable asset optimization in Netlify dashboard
2. Configure caching headers
3. Enable Brotli compression (automatic on Netlify)
4. Consider lazy loading for images

## Post-Deployment

After successful deployment:
1. Test the app on mobile devices
2. Check all routes work correctly
3. Verify dark/light theme switching
4. Test offline functionality (MMKV works in browser)

## Resources

- [Netlify Docs](https://docs.netlify.com/)
- [Expo Web Docs](https://docs.expo.dev/workflow/web/)
- [Tamagui Web Setup](https://tamagui.dev/docs/intro/installation)
