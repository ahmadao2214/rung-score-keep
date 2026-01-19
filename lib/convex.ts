import { ConvexReactClient } from 'convex/react';

// Convex URL - will be set when deployed
// For development, you can run `npx convex dev` to get a development URL
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

export const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

// Check if Convex is configured
export const isConvexConfigured = (): boolean => {
  return !!convexUrl;
};
