import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage, StorageKeys } from './mmkv';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  border: string;
  success: string;
  error: string;
  warning: string;
}

export const lightColors: ThemeColors = {
  background: '#F8F6F4',
  card: '#FFFFFF',
  cardAlt: '#FAFAFA',
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#8B8B8B',
  accent: '#2E7D32',
  accentLight: '#E8F5E9',
  border: '#E8E8E8',
  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#F59E0B',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  cardAlt: '#252525',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#707070',
  accent: '#4CAF50',
  accentLight: '#1B3D1C',
  border: '#333333',
  success: '#4CAF50',
  error: '#EF5350',
  warning: '#FFB74D',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = storage.getString(StorageKeys.THEME);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setMode(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    storage.set(StorageKeys.THEME, newMode);
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    storage.set(StorageKeys.THEME, newMode);
  };

  const colors = mode === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
