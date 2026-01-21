import { useState } from 'react';
import { ScrollView, Pressable, Alert, StyleSheet, TextInput, View, Text, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { validatePlayerNames, isValidPlayerCount, isValidDealerIndex } from '../utils/validation';
import { storageHelpers, StorageKeys } from '../lib/mmkv';
import { useTheme } from '../lib/theme';
import { isConvexConfigured } from '../lib/convex';

const PLAYER_EMOJIS = [
  '😊', '😎', '🤓', '🥳', '😈', '👻', '🤖', '👽',
  '🦊', '🐱', '🐶', '🐸', '🦁', '🐯', '🐻', '🐼',
  '🌟', '⚡', '🔥', '💎', '🎯', '🎲', '🃏', '👑',
  '🚀', '🎸', '🎮', '⚽', '🏀', '🎱', '🌈', '🍀',
];

const DEFAULT_EMOJIS = ['😊', '😎', '🤓', '🥳', '😈', '👻', '🤖', '👽'];

export default function NewGame() {
  const router = useRouter();
  const { colors } = useTheme();
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(4).fill('').map((_, i) => `Player ${i + 1}`)
  );
  const [playerEmojis, setPlayerEmojis] = useState<string[]>(DEFAULT_EMOJIS.slice(0, 4));
  const [dealerIndex, setDealerIndex] = useState(0);
  const [errors, setErrors] = useState<{ players?: string; general?: string }>({});
  const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Conditionally use Convex mutation when configured
  const convexConfigured = isConvexConfigured();
  let createGame: any = null;
  if (convexConfigured) {
    const { useMutation } = require('convex/react');
    const { api } = require('../convex/_generated/api');
    createGame = useMutation(api.games.createGame);
  }

  const handlePlayerCountChange = (count: number) => {
    if (!isValidPlayerCount(count)) return;
    setNumberOfPlayers(count);
    const newNames = Array(count).fill('').map((_, i) =>
      playerNames[i] || `Player ${i + 1}`
    );
    const newEmojis = Array(count).fill('').map((_, i) =>
      playerEmojis[i] || DEFAULT_EMOJIS[i] || '😊'
    );
    setPlayerNames(newNames);
    setPlayerEmojis(newEmojis);
    if (dealerIndex >= count) {
      setDealerIndex(count - 1);
    }
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
    setErrors({});
  };

  const handleEmojiSelect = (emoji: string) => {
    if (emojiPickerIndex === null) return;
    const newEmojis = [...playerEmojis];
    newEmojis[emojiPickerIndex] = emoji;
    setPlayerEmojis(newEmojis);
    setEmojiPickerIndex(null);
  };

  const handleStartGame = async () => {
    const nameValidation = validatePlayerNames(playerNames);
    if (!nameValidation.isValid) {
      setErrors({ players: nameValidation.error });
      Alert.alert('Validation Error', nameValidation.error);
      return;
    }

    if (!isValidDealerIndex(dealerIndex, numberOfPlayers)) {
      setErrors({ general: 'Invalid dealer selection' });
      Alert.alert('Validation Error', 'Please select a valid dealer');
      return;
    }

    setIsCreating(true);

    try {
      const players = playerNames.map((name, index) => ({
        name: name.trim(),
        emoji: playerEmojis[index] || '😊',
      }));

      let gameId: string;
      let joinCode: string | undefined;
      let convexGameId: string | undefined;

      // Try to create Convex game if configured
      if (convexConfigured && createGame) {
        try {
          const result = await createGame({
            numberOfPlayers,
            players,
            dealerIndex,
          });
          convexGameId = result.gameId as string;
          joinCode = result.joinCode;
          gameId = convexGameId; // Use Convex ID as primary ID
        } catch (err) {
          console.error('Failed to create Convex game:', err);
          // Fall back to local-only game
          gameId = `game_${Date.now()}`;
        }
      } else {
        // Local-only game
        gameId = `game_${Date.now()}`;
      }

      const game = {
        id: gameId,
        convexId: convexGameId, // Store Convex ID separately for reference
        joinCode, // Store join code for QR display
        numberOfPlayers,
        players: players.map((player, index) => ({
          id: `player_${Date.now()}_${index}`,
          name: player.name,
          position: index,
          emoji: player.emoji,
        })),
        dealerIndex,
        currentRound: 1,
        status: 'in_progress',
        createdAt: Date.now(),
      };

      storageHelpers.setObject(StorageKeys.CURRENT_GAME, game);
      router.push(`/game/${game.id}`);
    } catch (err) {
      console.error('Error creating game:', err);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <>
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>New Game</Text>
          <Text style={styles.subtitle}>Set up your Rung match</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Players</Text>
          <View style={styles.countRow}>
            {[2, 3, 4, 5, 6].map((count) => (
              <TouchableOpacity
                key={count}
                onPress={() => handlePlayerCountChange(count)}
                style={[
                  styles.countButton,
                  numberOfPlayers === count && styles.countButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.countButtonText,
                    numberOfPlayers === count && styles.countButtonTextActive,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Player Details</Text>
          {errors.players && (
            <Text style={styles.errorText}>{errors.players}</Text>
          )}
          <View style={styles.inputsContainer}>
            {playerNames.map((name, index) => (
              <View key={index} style={styles.playerRow}>
                <Pressable
                  style={styles.emojiButton}
                  onPress={() => setEmojiPickerIndex(index)}
                >
                  <Text style={styles.emojiButtonText}>{playerEmojis[index]}</Text>
                </Pressable>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    value={name}
                    onChangeText={(text) => handlePlayerNameChange(index, text)}
                    placeholder={`Player ${index + 1}`}
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.dealerHeader}>
            <Text style={styles.sectionTitle}>First Dealer</Text>
            <Text style={styles.sectionSubtitle}>Who deals the first hand?</Text>
          </View>
          <View style={styles.dealerList}>
            {playerNames.map((name, index) => (
              <Pressable
                key={index}
                onPress={() => setDealerIndex(index)}
                style={[
                  styles.dealerOption,
                  dealerIndex === index && styles.dealerOptionActive,
                ]}
              >
                <View style={styles.dealerRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      dealerIndex === index && styles.radioOuterActive,
                    ]}
                  >
                    {dealerIndex === index && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.dealerEmoji}>{playerEmojis[index]}</Text>
                  <Text
                    style={[
                      styles.dealerText,
                      dealerIndex === index && styles.dealerTextActive,
                    ]}
                  >
                    {name || `Player ${index + 1}`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={[styles.startButton, isCreating && styles.startButtonDisabled]}
          onPress={handleStartGame}
          disabled={isCreating}
        >
          <Text style={styles.startButtonText}>
            {isCreating ? 'Creating Game...' : 'Start Game'}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={emojiPickerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEmojiPickerIndex(null)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setEmojiPickerIndex(null)}
        >
          <View style={styles.emojiPicker}>
            <Text style={styles.emojiPickerTitle}>Choose an emoji</Text>
            <View style={styles.emojiGrid}>
              {PLAYER_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    emojiPickerIndex !== null && 
                    playerEmojis[emojiPickerIndex] === emoji && 
                    styles.emojiOptionSelected,
                  ]}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
    // @ts-ignore - web-specific property for proper scrolling
    maxHeight: '100vh',
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 12,
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  countButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 10,
    marginBottom: 10,
  },
  countButtonActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  countButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
  },
  countButtonTextActive: {
    color: colors.accent,
  },
  inputsContainer: {
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
  },
  emojiButtonText: {
    fontSize: 28,
  },
  nameInputContainer: {
    flex: 1,
  },
  textInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  dealerHeader: {
    marginBottom: 16,
  },
  dealerList: {
  },
  dealerOption: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  dealerOptionActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  dealerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  dealerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  dealerText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dealerTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emojiPicker: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emojiOption: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  emojiOptionSelected: {
    backgroundColor: colors.accentLight,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  emojiOptionText: {
    fontSize: 28,
  },
});
