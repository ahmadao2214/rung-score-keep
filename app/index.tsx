import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { storageHelpers, StorageKeys } from '../lib/mmkv';
import { useTheme } from '../lib/theme';

interface SavedGame {
  id: string;
  currentRound: number;
  players: { name: string; emoji?: string }[];
  status: string;
}

export default function Home() {
  const router = useRouter();
  const { colors, mode, toggleTheme } = useTheme();
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);

  useEffect(() => {
    const game = storageHelpers.getObject<SavedGame>(StorageKeys.CURRENT_GAME);
    if (game && game.status === 'in_progress') {
      setSavedGame(game);
    }
  }, []);

  const handleResumeGame = () => {
    if (savedGame) {
      router.push(`/game/${savedGame.id}`);
    }
  };

  const handleNewGame = () => {
    router.push('/new-game');
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Theme Toggle */}
      <Pressable style={styles.themeToggle} onPress={toggleTheme}>
        <Text style={styles.themeToggleText}>
          {mode === 'light' ? '🌙' : '☀️'}
        </Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🃏</Text>
        </View>

        <Text style={styles.title}>Rung</Text>
        <Text style={styles.subtitle}>Score Keeper</Text>
        <Text style={styles.tagline}>Track your card game scores with ease</Text>

        {savedGame && (
          <Pressable style={styles.resumeButton} onPress={handleResumeGame}>
            <Text style={styles.resumeButtonText}>
              Resume Game - Round {savedGame.currentRound}
            </Text>
            <Text style={styles.resumeSubtext}>
              {savedGame.players.map(p => p.emoji || '👤').join(' ')}
            </Text>
          </Pressable>
        )}

        <Pressable 
          style={[styles.button, savedGame && styles.buttonSecondary]} 
          onPress={handleNewGame}
        >
          <Text style={[styles.buttonText, savedGame && styles.buttonTextSecondary]}>
            Start New Game
          </Text>
        </Pressable>

        <View style={styles.cardsRow}>
          <Text style={styles.suitIcon}>♠</Text>
          <Text style={styles.suitIcon}>♥</Text>
          <Text style={styles.suitIcon}>♦</Text>
          <Text style={styles.suitIcon}>♣</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  themeToggleText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.accent,
    marginTop: -4,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 32,
  },
  resumeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  resumeSubtext: {
    color: '#FFFFFF',
    fontSize: 20,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 14,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: colors.accent,
  },
  cardsRow: {
    flexDirection: 'row',
    marginTop: 60,
  },
  suitIcon: {
    fontSize: 28,
    color: colors.textMuted,
    marginHorizontal: 8,
  },
});
