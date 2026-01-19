import { createTamagui, createTokens } from '@tamagui/core';
import { shorthands } from '@tamagui/shorthands';

// Create custom tokens
const tokens = createTokens({
  color: {
    white: '#ffffff',
    black: '#000000',
    gray1: '#fcfcfc',
    gray2: '#f8f8f8',
    gray3: '#f0f0f0',
    gray4: '#e0e0e0',
    gray5: '#d0d0d0',
    gray8: '#999999',
    gray10: '#666666',
    gray12: '#333333',
    blue2: '#e3f2fd',
    blue9: '#1976d2',
    blue10: '#007AFF',
    red9: '#d32f2f',
    red10: '#dc2626',
    green: '#2e7d32',
    greenFocus: '#1b5e20',
    shadowColor: 'rgba(0,0,0,0.1)',
  },
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
  },
});

// Extend the default Tamagui config with custom theme
const appConfig = createTamagui({
  tokens,
  shorthands,
  themes: {
    light: {
      background: '#f5f5f5',
      backgroundStrong: '#ffffff',
      color: '#000000',
      colorPress: '#333333',
      borderColor: '#e0e0e0',
      green: '#2e7d32',
      greenFocus: '#1b5e20',
      white: '#ffffff',
      black: '#000000',
      gray1: '#fcfcfc',
      gray2: '#f8f8f8',
      gray3: '#f0f0f0',
      gray4: '#e0e0e0',
      gray5: '#d0d0d0',
      gray8: '#999999',
      gray10: '#666666',
      gray12: '#333333',
      blue2: '#e3f2fd',
      blue9: '#1976d2',
      blue10: '#007AFF',
      red9: '#d32f2f',
      red10: '#dc2626',
      shadowColor: 'rgba(0,0,0,0.1)',
    },
    dark: {
      background: '#121212',
      backgroundStrong: '#1e1e1e',
      color: '#ffffff',
      colorPress: '#cccccc',
      borderColor: '#333333',
      green: '#2e7d32',
      greenFocus: '#1b5e20',
      white: '#ffffff',
      black: '#000000',
      gray1: '#1a1a1a',
      gray2: '#252525',
      gray3: '#303030',
      gray4: '#3a3a3a',
      gray5: '#454545',
      gray8: '#999999',
      gray10: '#b0b0b0',
      gray12: '#d0d0d0',
      blue2: '#1a3a52',
      blue9: '#42a5f5',
      blue10: '#64b5f6',
      red9: '#e57373',
      red10: '#ef5350',
      shadowColor: 'rgba(0,0,0,0.3)',
    },
  },
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
  },
});

export type AppConfig = typeof appConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
