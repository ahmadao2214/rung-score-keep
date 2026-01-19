import { useState } from 'react';
import { ScrollView, Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { calculatePoints } from '../../utils/scoring';

interface PlayerRound {
  playerId: string;
  playerName: string;
  playerEmoji: string;
  call: number;
  handsWon: number;
  points: number;
  isDealer: boolean;
}

interface PlayingModeProps {
  playerRounds: PlayerRound[];
  roundNumber: number;
  onComplete: (updatedPlayerRounds: PlayerRound[]) => void;
}

export function PlayingMode({ playerRounds, roundNumber, onComplete }: PlayingModeProps) {
  const { colors } = useTheme();
  const [handsWonState, setHandsWonState] = useState<{ [playerId: string]: number }>(
    playerRounds.reduce((acc, pr) => ({ ...acc, [pr.playerId]: pr.handsWon }), {})
  );
  const styles = createStyles(colors);

  const handleHandsWonChange = (playerId: string, delta: number) => {
    setHandsWonState(prev => {
      const current = prev[playerId] || 0;
      // No per-player cap - only prevent going below 0
      // Total validation happens when completing the round
      const newValue = Math.max(0, current + delta);
      return { ...prev, [playerId]: newValue };
    });
  };

  const handleCompleteRound = () => {
    const updatedPlayerRounds = playerRounds.map(pr => {
      const handsWon = handsWonState[pr.playerId] || 0;
      const points = calculatePoints(pr.call, handsWon);
      return { ...pr, handsWon, points };
    });

    onComplete(updatedPlayerRounds);
  };

  const totalHandsWon = Object.values(handsWonState).reduce((sum, val) => sum + val, 0);
  const isValidTotal = totalHandsWon === roundNumber;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roundTitle}>Round {roundNumber}</Text>
        <View style={styles.phaseBadge}>
          <Text style={styles.phaseBadgeText}>Playing</Text>
        </View>
      </View>

      {/* Total Hands Counter */}
      <View style={[
        styles.totalCard, 
        !isValidTotal && (totalHandsWon > roundNumber ? styles.totalCardError : styles.totalCardWarning)
      ]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Hands Won</Text>
          <View style={styles.totalCount}>
            <Text style={[
              styles.totalNumber,
              isValidTotal ? styles.totalValid : 
              totalHandsWon > roundNumber ? styles.totalExceeds : styles.totalPending
            ]}>
              {totalHandsWon}
            </Text>
            <Text style={styles.totalDivider}>/</Text>
            <Text style={styles.totalTarget}>{roundNumber}</Text>
          </View>
        </View>
        {!isValidTotal && (
          <Text style={[
            styles.totalHint,
            totalHandsWon > roundNumber && styles.totalHintError
          ]}>
            {totalHandsWon > roundNumber 
              ? `Too many! Remove ${totalHandsWon - roundNumber}` 
              : `Add ${roundNumber - totalHandsWon} more to continue`}
          </Text>
        )}
      </View>

      {/* Player Cards */}
      {playerRounds.map(pr => {
        const handsWon = handsWonState[pr.playerId] || 0;
        const expectedPoints = calculatePoints(pr.call, handsWon);
        const madeCall = handsWon === pr.call;

        return (
          <View key={pr.playerId} style={styles.playerCard}>
            {/* Player Header */}
            <View style={styles.playerHeader}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerEmoji}>{pr.playerEmoji || '👤'}</Text>
                <Text style={styles.playerName}>{pr.playerName}</Text>
                {pr.isDealer && (
                  <View style={styles.dealerBadge}>
                    <Text style={styles.dealerText}>D</Text>
                  </View>
                )}
              </View>
              <View style={styles.callBadge}>
                <Text style={styles.callLabel}>Called</Text>
                <Text style={styles.callNumber}>{pr.call}</Text>
              </View>
            </View>

            {/* Hands Counter */}
            <View style={styles.counterSection}>
              <Pressable
                onPress={() => handleHandsWonChange(pr.playerId, -1)}
                style={({ pressed }) => [
                  styles.counterButton,
                  styles.decrementButton,
                  pressed && styles.buttonPressed,
                  handsWon === 0 && styles.buttonDisabled,
                ]}
                disabled={handsWon === 0}
              >
                <Text style={[styles.counterButtonText, styles.decrementText]}>−</Text>
              </Pressable>

              <View style={styles.counterDisplay}>
                <Text style={styles.handsWonNumber}>{handsWon}</Text>
                <Text style={styles.handsWonLabel}>won</Text>
              </View>

              <Pressable
                onPress={() => handleHandsWonChange(pr.playerId, 1)}
                style={({ pressed }) => [
                  styles.counterButton,
                  styles.incrementButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.counterButtonText, styles.incrementText]}>+</Text>
              </Pressable>
            </View>

            {/* Points Preview */}
            <View style={[
              styles.pointsPreview, 
              madeCall && styles.pointsSuccess,
              handsWon > pr.call && styles.pointsOver
            ]}>
              {madeCall ? (
                <>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text style={styles.pointsText}>+{expectedPoints} pts</Text>
                </>
              ) : handsWon > pr.call ? (
                <Text style={styles.pointsOverText}>
                  Over by {handsWon - pr.call} · 0 pts
                </Text>
              ) : (
                <Text style={styles.pointsPending}>
                  Need {pr.call - handsWon} more
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {/* Complete Round Button */}
      <Pressable
        style={[styles.completeButton, !isValidTotal && styles.completeButtonDisabled]}
        onPress={handleCompleteRound}
        disabled={!isValidTotal}
      >
        <Text style={[styles.completeButtonText, !isValidTotal && styles.completeButtonTextDisabled]}>
          Complete Round
        </Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  roundTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginRight: 12,
  },
  phaseBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phaseBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  totalCardWarning: {
    borderColor: colors.warning,
    backgroundColor: colors.warning + '10',
  },
  totalCardError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
  },
  totalCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  totalValid: {
    color: colors.accent,
  },
  totalExceeds: {
    color: colors.error,
  },
  totalPending: {
    color: colors.warning,
  },
  totalDivider: {
    fontSize: 24,
    color: colors.border,
    marginHorizontal: 4,
  },
  totalTarget: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textMuted,
  },
  totalHint: {
    fontSize: 13,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  totalHintError: {
    color: colors.error,
  },
  playerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  dealerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callBadge: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  callLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  callNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  counterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decrementButton: {
    backgroundColor: colors.cardAlt,
  },
  incrementButton: {
    backgroundColor: colors.accent,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  counterButtonText: {
    fontSize: 28,
    fontWeight: '600',
  },
  decrementText: {
    color: colors.textSecondary,
  },
  incrementText: {
    color: '#FFFFFF',
  },
  counterDisplay: {
    alignItems: 'center',
  },
  handsWonNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
  },
  handsWonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: -4,
  },
  pointsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pointsSuccess: {
    backgroundColor: colors.accentLight,
  },
  pointsOver: {
    backgroundColor: colors.warning + '20',
  },
  checkmark: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '700',
    marginRight: 6,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  pointsPending: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  pointsOverText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.warning,
  },
  completeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonDisabled: {
    backgroundColor: colors.border,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  completeButtonTextDisabled: {
    color: colors.textMuted,
  },
});
