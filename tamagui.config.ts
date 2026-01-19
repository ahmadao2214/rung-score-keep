import { config } from '@tamagui/config/v3';
import { createTamagui } from '@tamagui/core';

// Extend the default Tamagui config with custom theme
const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    // Card game themed colors
    light: {
      ...config.themes.light,
      background: '#f5f5f5',
      backgroundStrong: '#ffffff',
      color: '#000000',
      colorPress: '#333333',
      borderColor: '#e0e0e0',
      green: '#2e7d32', // Card table green
      greenFocus: '#1b5e20',
    },
    dark: {
      ...config.themes.dark,
      background: '#121212',
      backgroundStrong: '#1e1e1e',
      color: '#ffffff',
      colorPress: '#cccccc',
      borderColor: '#333333',
      green: '#2e7d32',
      greenFocus: '#1b5e20',
    },
  },
});

export type AppConfig = typeof appConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
