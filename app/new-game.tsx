import { useState } from 'react';
import { ScrollView, Pressable, Alert, StyleSheet, TextInput, View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
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

// Generate a random 4-character uppercase join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function NewGame() {
  const router = useRouter();
  const { colors } = useTheme();
  const [setupMode, setSetupMode] = useState<'choose' | 'manual' | 'qr' | 'qr-scorekeeper'>('choose');
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(4).fill('').map((_, i) => `Player ${i + 1}`)
  );
  const [playerEmojis, setPlayerEmojis] = useState<string[]>(DEFAULT_EMOJIS.slice(0, 4));
  const [dealerIndex, setDealerIndex] = useState(0);
  const [errors, setErrors] = useState<{ players?: string; general?: string }>({});
  const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // QR mode: scorekeeper info
  const [scorekeeperName, setScorekeeperName] = useState('');
  const [scorekeeperEmoji, setScorekeeperEmoji] = useState('😊');
  const [showScorekeeperEmojiPicker, setShowScorekeeperEmojiPicker] = useState(false);

  // Convex mutations (only loaded if Convex is configured)
  const createLobby = isConvexConfigured()
    ? require('convex/react').useMutation(require('../convex/_generated/api').api.games.createLobby)
    : null;

  const joinLobby = isConvexConfigured()
    ? require('convex/react').useMutation(require('../convex/_generated/api').api.games.joinLobby)
    : null;

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

  const handleStartGameManual = () => {
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

    const game = {
      id: `game_${Date.now()}`,
      numberOfPlayers,
      players: playerNames.map((name, index) => ({
        id: `player_${Date.now()}_${index}`,
        name: name.trim(),
        position: index,
        emoji: playerEmojis[index] || '😊',
      })),
      dealerIndex,
      currentRound: 1,
      status: 'in_progress',
      createdAt: Date.now(),
      joinCode: generateJoinCode(),
      playerSessions: [],
    };

    storageHelpers.setObject(StorageKeys.CURRENT_GAME, game);
    router.push(`/game/${game.id}`);
  };

  const handleStartGameQR = async () => {
    // Validate scorekeeper name
    if (!scorekeeperName.trim()) {
      setErrors({ general: 'Please enter your name' });
      Alert.alert('Validation Error', 'Please enter your name as the scorekeeper');
      return;
    }

    setIsCreating(true);
    setErrors({});

    try {
      if (isConvexConfigured() && createLobby && joinLobby) {
        // Use Convex for cross-device multiplayer
        const result = await createLobby({ numberOfPlayers });

        // Add scorekeeper as the first player
        await joinLobby({
          joinCode: result.joinCode,
          playerName: scorekeeperName.trim(),
          playerEmoji: scorekeeperEmoji,
          deviceId: `host_${Date.now()}`,
        });

        // Store game info locally for quick access
        const game = {
          id: result.gameId,
          numberOfPlayers,
          players: [{
            id: `player_${Date.now()}_0`,
            name: scorekeeperName.trim(),
            position: 0,
            emoji: scorekeeperEmoji,
          }],
          dealerIndex: 0,
          currentRound: 1,
          status: 'lobby',
          createdAt: Date.now(),
          joinCode: result.joinCode,
          playerSessions: [],
        };

        storageHelpers.setObject(StorageKeys.CURRENT_GAME, game);
        router.push(`/game/${result.gameId}`);
      } else {
        // Fallback to local storage (offline mode)
        const game = {
          id: `game_${Date.now()}`,
          numberOfPlayers,
          players: [{
            id: `player_${Date.now()}_0`,
            name: scorekeeperName.trim(),
            position: 0,
            emoji: scorekeeperEmoji,
          }],
          dealerIndex: 0,
          currentRound: 1,
          status: 'lobby',
          createdAt: Date.now(),
          joinCode: generateJoinCode(),
          playerSessions: [],
        };

        storageHelpers.setObject(StorageKeys.CURRENT_GAME, game);
        router.push(`/game/${game.id}`);
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create lobby' });
      Alert.alert('Error', error.message || 'Failed to create lobby');
    } finally {
      setIsCreating(false);
    }
  };

  const styles = createStyles(colors);

  // Choose setup mode screen
  if (setupMode === 'choose') {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>New Game</Text>
          <Text style={styles.subtitle}>How do you want to set up?</Text>
        </View>

        <Pressable
          style={styles.setupOptionCard}
          onPress={() => setSetupMode('qr-scorekeeper')}
        >
          <Text style={styles.setupEmoji}>📱</Text>
          <Text style={styles.setupTitle}>Join with QR Code</Text>
          <Text style={styles.setupDescription}>
            You and other players join via QR code
          </Text>
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>Recommended</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.setupOptionCard}
          onPress={() => setSetupMode('manual')}
        >
          <Text style={styles.setupEmoji}>✏️</Text>
          <Text style={styles.setupTitle}>Manual Setup</Text>
          <Text style={styles.setupDescription}>
            Enter all player names yourself before starting
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // QR setup mode - scorekeeper enters their info first
  if (setupMode === 'qr-scorekeeper') {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Pressable onPress={() => setSetupMode('choose')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>QR Code Setup</Text>
          <Text style={styles.subtitle}>Enter your details</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>You're a player too!</Text>
          <Text style={styles.infoText}>
            As the scorekeeper, you're also playing. Enter your name and emoji below.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Choose Your Emoji</Text>
          <Pressable
            style={styles.emojiButton}
            onPress={() => setShowScorekeeperEmojiPicker(true)}
          >
            <Text style={styles.emojiButtonText}>{scorekeeperEmoji}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Name</Text>
          {errors.general && (
            <Text style={styles.errorText}>{errors.general}</Text>
          )}
          <View style={styles.nameInputContainer}>
            <TextInput
              value={scorekeeperName}
              onChangeText={(text) => {
                setScorekeeperName(text);
                setErrors({});
              }}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
              autoCapitalize="words"
              autoFocus
            />
          </View>
        </View>

        <Pressable
          style={[styles.startButton, !scorekeeperName.trim() && styles.startButtonDisabled]}
          onPress={() => {
            if (!scorekeeperName.trim()) {
              setErrors({ general: 'Please enter your name' });
              return;
            }
            setSetupMode('qr');
          }}
          disabled={!scorekeeperName.trim()}
        >
          <Text style={styles.startButtonText}>Next: Select Total Players</Text>
        </Pressable>

        {/* Scorekeeper Emoji Picker Modal */}
        <Modal
          visible={showScorekeeperEmojiPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowScorekeeperEmojiPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowScorekeeperEmojiPicker(false)}
          >
            <View style={styles.emojiPicker}>
              <Text style={styles.emojiPickerTitle}>Choose your emoji</Text>
              <View style={styles.emojiGrid}>
                {PLAYER_EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      scorekeeperEmoji === emoji && styles.emojiOptionSelected,
                    ]}
                    onPress={() => {
                      setScorekeeperEmoji(emoji);
                      setShowScorekeeperEmojiPicker(false);
                    }}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
    );
  }

  // QR setup mode - select total number of players (including scorekeeper)
  if (setupMode === 'qr') {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Pressable onPress={() => setSetupMode('qr-scorekeeper')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>QR Code Setup</Text>
          <Text style={styles.subtitle}>Total players (including you)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Total Number of Players</Text>
          <Text style={styles.sectionSubtitle}>
            You're already player #1. How many total?
          </Text>
          <View style={styles.countRow}>
            {[2, 3, 4, 5, 6].map((count) => (
              <TouchableOpacity
                key={count}
                onPress={() => setNumberOfPlayers(count)}
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

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next:</Text>
          <Text style={styles.infoText}>
            1. You'll see a QR code in the lobby{'\n'}
            2. {numberOfPlayers - 1} more {numberOfPlayers - 1 === 1 ? 'player scans' : 'players scan'} the code{'\n'}
            3. They enter their name and emoji{'\n'}
            4. Start the game once everyone joins
          </Text>
        </View>

        <Pressable
          style={[styles.startButton, isCreating && styles.startButtonDisabled]}
          onPress={handleStartGameQR}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.startButtonText}>Create Game & Show QR</Text>
          )}
        </Pressable>
      </ScrollView>
    );
  }

  // Manual setup mode (original flow)
  return (
    <>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Pressable onPress={() => setSetupMode('choose')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Manual Setup</Text>
          <Text style={styles.subtitle}>Enter player details</Text>
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

        <Pressable style={styles.startButton} onPress={handleStartGameManual}>
          <Text style={styles.startButtonText}>Start Game</Text>
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
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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
  setupOptionCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  setupEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  setupDescription: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  recommendedBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  backButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  infoCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
});
