import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { isConvexConfigured } from '../../lib/convex';

// Local storage join flow (when Convex is not configured)
function LocalJoinGame({ code, colors }: { code: string; colors: any }) {
  const styles = createStyles(colors);
  const router = useRouter();
  const { storageHelpers, StorageKeys } = require('../../lib/mmkv');

  const [playerName, setPlayerName] = React.useState('');
  const [selectedEmoji, setSelectedEmoji] = React.useState('😊');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [joined, setJoined] = React.useState(false);

  const PLAYER_EMOJIS = [
    '😊', '😎', '🤓', '🥳', '😈', '👻', '🤖', '👽',
    '🦊', '🐱', '🐶', '🐸', '🦁', '🐯', '🐻', '🐼',
    '🌟', '⚡', '🔥', '💎', '🎯', '🎲', '🃏', '👑',
    '🚀', '🎸', '🎮', '⚽', '🏀', '🎱', '🌈', '🍀',
  ];

  const handleJoinGame = () => {
    setError(null);

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const game = storageHelpers.getObject(StorageKeys.CURRENT_GAME);

    if (!game) {
      setError('Game not found');
      return;
    }

    if (game.joinCode !== code?.toUpperCase()) {
      setError('Invalid join code');
      return;
    }

    if (game.status !== 'lobby') {
      setError('Game has already started');
      return;
    }

    if (game.players.length >= game.numberOfPlayers) {
      setError('Game is full');
      return;
    }

    if (game.players.some((p: any) => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
      setError('Name is already taken');
      return;
    }

    const newPlayer = {
      id: `player_${Date.now()}_${game.players.length}`,
      name: playerName.trim(),
      position: game.players.length,
      emoji: selectedEmoji,
    };

    const updatedGame = {
      ...game,
      players: [...game.players, newPlayer],
      playerSessions: [
        ...(game.playerSessions || []),
        {
          playerId: newPlayer.id,
          joinedAt: Date.now(),
          deviceId: `web_${Date.now()}`,
        },
      ],
    };

    storageHelpers.setObject(StorageKeys.CURRENT_GAME, updatedGame);
    setJoined(true);
  };

  if (joined) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>You're In!</Text>
          <Text style={styles.subtitle}>
            You've joined as {selectedEmoji} {playerName}{'\n\n'}
            Wait for the host to start the game
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Join Game</Text>
          <Text style={styles.subtitle}>Code: {code}</Text>
        </View>

        {error && (
          <View style={[styles.card, { backgroundColor: colors.error + '20', borderWidth: 1, borderColor: colors.error }]}>
            <Text style={[styles.subtitle, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Choose Your Emoji</Text>
          <Pressable
            style={[styles.playerOption, { justifyContent: 'center', minHeight: 80 }]}
            onPress={() => setShowEmojiPicker(true)}
          >
            <Text style={styles.playerOptionEmoji}>{selectedEmoji}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Enter Your Name</Text>
          <TextInput
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            style={[styles.playerOption, {
              paddingVertical: 16,
              fontSize: 18,
              textAlign: 'center',
              color: colors.text,
            }]}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleJoinGame}
          />
        </View>

        <Pressable
          style={[styles.submitButton, !playerName.trim() && styles.submitButtonDisabled]}
          onPress={handleJoinGame}
          disabled={!playerName.trim()}
        >
          <Text style={styles.submitButtonText}>Join Game</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
          }}>
            <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 16 }]}>
              Choose an emoji
            </Text>
            <ScrollView contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {PLAYER_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[
                    styles.callOption,
                    selectedEmoji === emoji && styles.callOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedEmoji(emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  <Text style={{ fontSize: 32 }}>{emoji}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// Component that uses Convex hooks - only renders when Convex is configured
function ConvexJoinGame({ code, colors }: { code: string; colors: any }) {
  const styles = createStyles(colors);
  const router = useRouter();

  // Dynamic imports for Convex - only used when configured
  const { useQuery, useMutation } = require('convex/react');
  const { api } = require('../../convex/_generated/api');

  const [playerName, setPlayerName] = React.useState('');
  const [selectedEmoji, setSelectedEmoji] = React.useState('😊');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);
  const [joined, setJoined] = React.useState(false);

  const PLAYER_EMOJIS = [
    '😊', '😎', '🤓', '🥳', '😈', '👻', '🤖', '👽',
    '🦊', '🐱', '🐶', '🐸', '🦁', '🐯', '🐻', '🐼',
    '🌟', '⚡', '🔥', '💎', '🎯', '🎲', '🃏', '👑',
    '🚀', '🎸', '🎮', '⚽', '🏀', '🎱', '🌈', '🍀',
  ];

  // Get game by join code
  const game = useQuery(api.games.getGameByJoinCode, {
    joinCode: code?.toUpperCase() || ''
  });

  const joinLobby = useMutation(api.games.joinLobby);

  const handleJoinGame = async () => {
    setError(null);

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setJoining(true);

    try {
      await joinLobby({
        joinCode: code?.toUpperCase() || '',
        playerName: playerName.trim(),
        playerEmoji: selectedEmoji,
        deviceId: `web_${Date.now()}`,
      });
      setJoined(true);
    } catch (err: any) {
      setError(err.message || 'Failed to join game');
    } finally {
      setJoining(false);
    }
  };

  // Loading state
  if (game === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Finding game...</Text>
      </View>
    );
  }

  // Game not found
  if (game === null) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>❌</Text>
          <Text style={styles.title}>Game Not Found</Text>
          <Text style={styles.subtitle}>
            The code "{code}" doesn't match any active game.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => router.push('/')}>
            <Text style={styles.retryButtonText}>Go Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Joining state
  if (joining) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Joining game...</Text>
      </View>
    );
  }

  // Success screen
  if (joined) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>You're In!</Text>
          <Text style={styles.subtitle}>
            You've joined as {selectedEmoji} {playerName}{'\n\n'}
            Wait for the host to start the game
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Join Game</Text>
          <Text style={styles.subtitle}>Code: {code}</Text>
        </View>

        {error && (
          <View style={[styles.card, { backgroundColor: colors.error + '20', borderWidth: 1, borderColor: colors.error }]}>
            <Text style={[styles.subtitle, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Choose Your Emoji</Text>
          <Pressable
            style={[styles.playerOption, { justifyContent: 'center', minHeight: 80 }]}
            onPress={() => setShowEmojiPicker(true)}
          >
            <Text style={styles.playerOptionEmoji}>{selectedEmoji}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Enter Your Name</Text>
          <TextInput
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            style={[styles.playerOption, {
              paddingVertical: 16,
              fontSize: 18,
              textAlign: 'center',
              color: colors.text,
            }]}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleJoinGame}
          />
        </View>

        <Pressable
          style={[styles.submitButton, !playerName.trim() && styles.submitButtonDisabled]}
          onPress={handleJoinGame}
          disabled={!playerName.trim()}
        >
          <Text style={styles.submitButtonText}>Join Game</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
          }}>
            <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 16 }]}>
              Choose an emoji
            </Text>
            <ScrollView contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {PLAYER_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[
                    styles.callOption,
                    selectedEmoji === emoji && styles.callOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedEmoji(emoji);
                    setShowEmojiPicker(false);
                  }}
                >
                  <Text style={{ fontSize: 32 }}>{emoji}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function JoinGame() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { colors } = useTheme();

  // Use local storage join flow when Convex is not configured
  if (!isConvexConfigured()) {
    return <LocalJoinGame code={code || ''} colors={colors} />;
  }

  return <ConvexJoinGame code={code || ''} colors={colors} />;
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerList: {
    width: '100%',
  },
  playerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playerOptionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  playerOptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  playerEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  roundCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  roundLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  trumpInfo: {
    alignItems: 'center',
  },
  trumpLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trumpCard: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  callGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  callOption: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
  },
  callOptionSelected: {
    backgroundColor: colors.accent,
  },
  callOptionText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  callOptionTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultBox: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.accent,
  },
  callsList: {
    width: '100%',
    marginTop: 16,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  callEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  callName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  callStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  callStatusDone: {
    color: colors.accent,
  },
  callStatusWaiting: {
    color: colors.textMuted,
  },
});
