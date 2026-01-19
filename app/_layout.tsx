import { Component, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from '@tamagui/core';
import { View, Text, ScrollView, Platform, Pressable } from 'react-native';
import { ConvexProvider } from 'convex/react';
import config from '../tamagui.config';
import { ThemeProvider, useTheme } from '../lib/theme';
import { convex, isConvexConfigured } from '../lib/convex';

// Set emoji favicon for web
function useEmojiFavicon(emoji: string) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // Set page title
    document.title = 'Rung Score Keeper';
    
    // Create SVG favicon with emoji
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text y=".9em" font-size="90">${emoji}</text>
      </svg>
    `;
    const encodedSvg = encodeURIComponent(svg);
    const dataUrl = `data:image/svg+xml,${encodedSvg}`;
    
    // Remove existing favicons
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());
    
    // Add new favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = dataUrl;
    document.head.appendChild(link);
  }, [emoji]);
}

// Theme Toggle Button Component
function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();
  
  return (
    <Pressable 
      onPress={toggleTheme}
      style={{ 
        padding: 8,
        marginRight: 8,
      }}
    >
      <Text style={{ fontSize: 20 }}>
        {mode === 'light' ? '🌙' : '☀️'}
      </Text>
    </Pressable>
  );
}

// Main Navigation with Theme
function ThemedNavigation() {
  const { colors, mode } = useTheme();
  
  return (
    <>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          headerRight: () => <ThemeToggle />,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="new-game" 
          options={{ 
            title: 'New Game',
            headerBackTitle: 'Back',
          }} 
        />
        <Stack.Screen 
          name="game/[id]" 
          options={{ 
            title: 'Game',
            headerBackTitle: 'Back',
          }} 
        />
        <Stack.Screen 
          name="join/[code]" 
          options={{ 
            title: 'Join Game',
            headerShown: false,
          }} 
        />
      </Stack>
    </>
  );
}

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
          <ScrollView>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              Something went wrong
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              {this.state.error?.toString()}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
              {this.state.error?.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  return (
    <ThemeProvider>
      <TamaguiProvider config={config} defaultTheme="light">
        <ThemedNavigation />
      </TamaguiProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEmojiFavicon('🃏');
  
  const content = <AppContent />;
  
  // Wrap with ConvexProvider if configured
  if (isConvexConfigured() && convex) {
    return (
      <ErrorBoundary>
        <ConvexProvider client={convex}>
          {content}
        </ConvexProvider>
      </ErrorBoundary>
    );
  }
  
  return (
    <ErrorBoundary>
      {content}
    </ErrorBoundary>
  );
}
