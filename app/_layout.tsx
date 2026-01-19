import { Component } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider } from '@tamagui/core';
import { useColorScheme, View, Text, ScrollView } from 'react-native';
import config from '../tamagui.config';

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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  console.log('RootLayout rendering...');
  console.log('ColorScheme:', colorScheme);

  return (
    <ErrorBoundary>
      <TamaguiProvider config={config} defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Rung Score Keeper' }} />
          <Stack.Screen name="new-game" options={{ title: 'New Game' }} />
          <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
        </Stack>
      </TamaguiProvider>
    </ErrorBoundary>
  );
}
