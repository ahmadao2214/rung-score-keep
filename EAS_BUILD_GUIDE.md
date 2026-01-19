# EAS Build & Submission Guide for iOS

This guide covers building and submitting the Rung Score Keeper app to iOS using Expo Application Services (EAS).

## Prerequisites

### 1. Apple Developer Account
- Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
- You need this to distribute apps on the App Store or TestFlight

### 2. Install EAS CLI
```bash
npm install -g eas-cli
```

### 3. Login to Expo
```bash
eas login
```

If you don't have an Expo account:
```bash
eas register
```

## Configuration

The project is already configured with:
- **`eas.json`**: Build profiles (development, preview, production)
- **`app.json`**: App metadata and bundle identifier

### Update Bundle Identifier

Edit `app.json` and change the bundle identifier:
```json
"ios": {
  "bundleIdentifier": "com.yourcompany.rungscorekeeper"
}
```

**Format**: `com.yourname.appname` (must be unique on App Store)

## Build for iOS

### Option 1: Build for TestFlight/App Store (Production)

```bash
eas build --platform ios --profile production
```

This will:
1. Ask you to configure your iOS credentials (first time only)
2. Build the app on Expo's cloud servers
3. Generate an `.ipa` file (iOS app package)
4. Takes ~10-20 minutes

### Option 2: Build for Internal Testing (Preview)

```bash
eas build --platform ios --profile preview
```

This creates an ad-hoc build you can install on specific devices without TestFlight.

### Option 3: Build for iOS Simulator (Development)

```bash
eas build --platform ios --profile development
```

Only works on simulator, not physical devices. Fast for testing.

## Submit to App Store

### 1. Create App in App Store Connect

First, create your app listing:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Rung Score Keeper
   - **Primary Language**: English
   - **Bundle ID**: com.yourname.rungscorekeeper (same as app.json)
   - **SKU**: rung-score-keeper (any unique string)
4. Click **Create**

Take note of the **App ID** (numeric, like 1234567890)

### 2. Update eas.json with App Store Info

Edit `eas.json` and update the submit section:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABC123XYZ"
    }
  }
}
```

**Where to find:**
- `appleId`: Your Apple ID email
- `ascAppId`: The numeric App ID from App Store Connect
- `appleTeamId`: Found in [developer.apple.com](https://developer.apple.com/account) → Membership → Team ID

### 3. Submit to App Store

After your production build completes:

```bash
eas submit --platform ios --latest
```

Or specify a specific build:

```bash
eas submit --platform ios --id [build-id]
```

This uploads the app to App Store Connect for TestFlight and App Store review.

## Step-by-Step: First-Time Setup

### Complete Workflow

```bash
# 1. Login to Expo
eas login

# 2. Configure project (first time)
eas build:configure

# 3. Build for production
eas build --platform ios --profile production

# 4. Wait for build to complete (~15 min)
# You'll get a URL to download the .ipa file

# 5. Submit to App Store Connect
eas submit --platform ios --latest

# 6. Go to App Store Connect to complete listing
```

## TestFlight Distribution

After submission, the app automatically goes to TestFlight:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **TestFlight** tab
3. Add internal or external testers
4. They'll receive an email to install via TestFlight app

**Internal Testing:**
- Up to 100 testers (anyone on your team)
- No review required
- Available immediately after upload

**External Testing:**
- Up to 10,000 testers
- Requires Apple review (1-2 days)
- Public beta testing

## App Store Submission

Once ready for public release:

1. **Complete App Information** in App Store Connect:
   - Description
   - Screenshots (iPhone 6.7", 6.5", 5.5")
   - App icon (1024x1024)
   - Privacy policy URL
   - Support URL

2. **Submit for Review**:
   - Click **Submit for Review**
   - Answer questionnaire
   - Wait 1-3 days for Apple review

3. **Release**:
   - Approve for automatic release
   - Or manually release after approval

## Build Profiles Explained

### Development
```bash
eas build --platform ios --profile development
```
- For iOS Simulator only
- Fast builds
- Development client with debugging

### Preview
```bash
eas build --platform ios --profile preview
```
- Ad-hoc distribution (up to 100 devices)
- Install without TestFlight
- Good for stakeholder previews

### Production
```bash
eas build --platform ios --profile production
```
- For TestFlight and App Store
- Optimized, minified code
- Required for public distribution

## Troubleshooting

### "No bundle identifier"
- Add `bundleIdentifier` to `app.json` under `ios` section

### "Credentials not found"
```bash
eas credentials
```
Select iOS → Generate new credentials

### "Build failed"
- Check build logs in the EAS dashboard
- Common issues: Missing dependencies, TypeScript errors

### "Submission failed"
- Verify App Store Connect app is created
- Check `ascAppId` matches the App ID
- Ensure bundle ID matches

## Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Manage credentials
eas credentials

# Cancel a build
eas build:cancel [build-id]

# View submission status
eas submit:list
```

## Cost

### Free Tier (Hobby)
- Unlimited builds
- Longer build times
- Single concurrent build

### Paid Plans
- Faster builds
- Multiple concurrent builds
- Priority queue

**Note**: No credit card needed for free tier!

## Next Steps

1. **Test Locally First**:
   ```bash
   npm run ios  # Run in iOS simulator
   ```

2. **Build Preview**:
   ```bash
   eas build --platform ios --profile preview
   ```

3. **Install on Device**:
   - Download .ipa from EAS dashboard
   - Install via TestFlight or ad-hoc

4. **Submit to App Store**:
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```

## Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Guide](https://developer.apple.com/testflight/)

---

**Ready to build?** Run:
```bash
eas build --platform ios --profile production
```
