import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { isConvexConfigured } from '../../lib/convex';

// Fallback component when Convex is not configured
function ConvexNotConfigured({ colors }: { colors: any }) {
  const styles = createStyles(colors);
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>⚙️</Text>
        <Text style={styles.title}>Setup Required</Text>
        <Text style={styles.subtitle}>
          QR code sync requires Convex to be configured.{'\n\n'}
          To enable this feature:{'\n'}
          1. Run: npx convex dev{'\n'}
          2. Set EXPO_PUBLIC_CONVEX_URL in your environment{'\n'}
          3. Restart the app
        </Text>
        <Pressable style={styles.retryButton} onPress={() => router.push('/')}>
          <Text style={styles.retryButtonText}>Go Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Component that uses Convex hooks - only renders when Convex is configured
function ConvexJoinGame({ code, colors }: { code: string; colors: any }) {
  const styles = createStyles(colors);
  const router = useRouter();
  
  // Dynamic imports for Convex - only used when configured
  const { useQuery, useMutation } = require('convex/react');
  const { api } = require('../../convex/_generated/api');
  
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get game by join code
  const game = useQuery(api.games.getGameByJoinCode, { 
    joinCode: code?.toUpperCase() || '' 
  });

  const joinGame = useMutation(api.games.joinGame);
  const submitCall = useMutation(api.rounds.submitPlayerCall);

  // Get current round data for player
  const roundData = useQuery(
    api.rounds.getCurrentRoundForPlayer, 
    selectedPlayer ? { gameId: game?._id, playerId: selectedPlayer.id } : 'skip'
  );

  const handlePlayerSelect = async (player: any) => {
    setJoining(true);
    setError(null);
    
    try {
      await joinGame({
        joinCode: code?.toUpperCase() || '',
        playerId: player.id,
        deviceId: `web_${Date.now()}`,
      });
      setSelectedPlayer(player);
    } catch (err: any) {
      setError(err.message || 'Failed to join game');
    } finally {
      setJoining(false);
    }
  };

  const handleSubmitCall = async () => {
    if (selectedCall === null || !game || !roundData?.round) return;
    
    setSubmitting(true);
    try {
      await submitCall({
        gameId: game._id,
        roundNumber: roundData.round.roundNumber,
        playerId: selectedPlayer.id,
        call: selectedCall,
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit call');
    } finally {
      setSubmitting(false);
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

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => setError(null)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
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

  // Player selection
  if (!selectedPlayer) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Select Your Name</Text>
          <Text style={styles.subtitle}>Who are you?</Text>

          <View style={styles.playerList}>
            {game.players.map((player: any) => (
              <Pressable
                key={player.id}
                style={styles.playerOption}
                onPress={() => handlePlayerSelect(player)}
              >
                <Text style={styles.playerOptionEmoji}>{player.emoji || '👤'}</Text>
                <Text style={styles.playerOptionName}>{player.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Loading round data
  if (!roundData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const { round, playerRound, allCalls } = roundData;

  // Waiting for round to start
  if (!round) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>⏳</Text>
          <Text style={styles.title}>Waiting for Round</Text>
          <Text style={styles.subtitle}>
            The scorekeeper hasn't started the round yet.
          </Text>
        </View>
      </View>
    );
  }

  // Not in calling phase
  if (round.status !== 'calling') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎮</Text>
          <Text style={styles.title}>Round {round.roundNumber}</Text>
          <Text style={styles.subtitle}>
            {round.status === 'playing' 
              ? 'Playing phase - check with the scorekeeper'
              : 'Round complete - waiting for next round'
            }
          </Text>
          
          {playerRound && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Your Call</Text>
              <Text style={styles.resultNumber}>{playerRound.call}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Check if player already called
  const hasCalled = playerRound?.hasCalled || submitted;

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.playerEmoji}>{selectedPlayer.emoji || '👤'}</Text>
        <Text style={styles.welcomeText}>Hi, {selectedPlayer.name}!</Text>
      </View>

      <View style={styles.roundCard}>
        <Text style={styles.roundLabel}>Round {round.roundNumber}</Text>
        {round.trumpCard && (
          <View style={styles.trumpInfo}>
            <Text style={styles.trumpLabel}>Trump</Text>
            <Text style={styles.trumpCard}>{round.trumpCard.displayText}</Text>
          </View>
        )}
      </View>

      {hasCalled ? (
        <View style={styles.card}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>Call Submitted!</Text>
          <Text style={styles.subtitle}>
            You called {playerRound?.call ?? selectedCall}. 
            Waiting for other players...
          </Text>
          
          <View style={styles.callsList}>
            {allCalls?.map((p: any) => (
              <View key={p.playerId} style={styles.callRow}>
                <Text style={styles.callEmoji}>{p.playerEmoji || '👤'}</Text>
                <Text style={styles.callName}>{p.playerName}</Text>
                <Text style={[
                  styles.callStatus,
                  p.hasCalled ? styles.callStatusDone : styles.callStatusWaiting
                ]}>
                  {p.hasCalled ? `Called ${p.call}` : 'Waiting...'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Enter Your Call</Text>
          <Text style={styles.sectionSubtitle}>
            How many hands do you think you'll win?
          </Text>

          <View style={styles.callGrid}>
            {Array.from({ length: round.roundNumber + 1 }, (_, i) => i).map(num => (
              <Pressable
                key={num}
                style={[
                  styles.callOption,
                  selectedCall === num && styles.callOptionSelected,
                ]}
                onPress={() => setSelectedCall(num)}
              >
                <Text style={[
                  styles.callOptionText,
                  selectedCall === num && styles.callOptionTextSelected,
                ]}>
                  {num}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[
              styles.submitButton,
              (selectedCall === null || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitCall}
            disabled={selectedCall === null || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Call'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

export default function JoinGame() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { colors } = useTheme();

  // Check if Convex is configured
  if (!isConvexConfigured()) {
    return <ConvexNotConfigured colors={colors} />;
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
