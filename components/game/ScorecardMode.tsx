import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { ScoreTable } from './ScoreTable';
import { useTheme } from '../../lib/theme';

interface Player {
  id: string;
  name: string;
  position: number;
  emoji?: string;
}

interface Round {
  roundNumber: number;
  playerRounds: {
    playerId: string;
    playerName: string;
    call: number;
    handsWon: number;
    points: number;
    isDealer: boolean;
  }[];
  status: 'calling' | 'playing' | 'completed';
}

interface ScorecardModeProps {
  players: Player[];
  rounds: Round[];
  currentRound: number;
  onStartNextRound: () => void;
  onEndGame: () => void;
}

export function ScorecardMode({
  players,
  rounds,
  currentRound,
  onStartNextRound,
  onEndGame,
}: ScorecardModeProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Calculate player scores
  const playerScores = players.map(player => {
    const roundData: { call: number; points: number }[] = [];
    let totalPoints = 0;

    for (let i = 1; i <= currentRound; i++) {
      const round = rounds.find(r => r.roundNumber === i);
      const playerRound = round?.playerRounds.find(pr => pr.playerId === player.id);

      if (playerRound) {
        roundData.push({ call: playerRound.call, points: playerRound.points });
        totalPoints += playerRound.points;
      }
    }

    return {
      playerId: player.id,
      playerName: player.name,
      emoji: player.emoji || '👤',
      roundData,
      totalPoints,
    };
  });

  // Sort by total points for leaderboard
  const leaderboard = [...playerScores].sort((a, b) => b.totalPoints - a.totalPoints);
  const leader = leaderboard[0];
  const isGameComplete = currentRound >= 13;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Scorecard</Text>
        <View style={styles.roundBadge}>
          <Text style={styles.roundBadgeText}>Round {currentRound}</Text>
        </View>
      </View>

      <View style={styles.leaderboard}>
        {leaderboard.map((player, index) => (
          <View 
            key={player.playerId} 
            style={[
              styles.leaderRow,
              index === 0 && styles.leaderRowFirst,
            ]}
          >
            <View style={styles.leaderLeft}>
              <Text style={[styles.rank, index === 0 && styles.rankFirst]}>
                {index + 1}
              </Text>
              <Text style={styles.playerEmoji}>{player.emoji}</Text>
              <Text style={[styles.playerName, index === 0 && styles.playerNameFirst]}>
                {player.playerName}
              </Text>
            </View>
            <Text style={[styles.score, index === 0 && styles.scoreFirst]}>
              {player.totalPoints}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.leaderHighlight}>
        <Text style={styles.leaderLabel}>
          {isGameComplete ? '🏆 Winner' : 'Leading'}
        </Text>
        <View style={styles.leaderInfo}>
          <Text style={styles.leaderEmoji}>{leader.emoji}</Text>
          <Text style={styles.leaderName}>{leader.playerName}</Text>
        </View>
        <Text style={styles.leaderPoints}>{leader.totalPoints} pts</Text>
      </View>

      <Text style={styles.sectionTitle}>Round Details</Text>
      <ScoreTable playerScores={playerScores} currentRound={currentRound} />

      {isGameComplete ? (
        <View style={styles.completeSection}>
          <Text style={styles.completeText}>Game Complete! 🎉</Text>
          <Pressable style={styles.endButton} onPress={onEndGame}>
            <Text style={styles.endButtonText}>End Game</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.nextButton} onPress={onStartNextRound}>
          <Text style={styles.nextButtonText}>Start Round {currentRound + 1}</Text>
        </Pressable>
      )}

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
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  roundBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roundBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  leaderboard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderRowFirst: {
    backgroundColor: colors.warning + '15',
    borderBottomWidth: 0,
  },
  leaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    width: 24,
    marginRight: 12,
  },
  rankFirst: {
    color: colors.warning,
  },
  playerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  playerNameFirst: {
    fontWeight: '700',
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  scoreFirst: {
    color: colors.accent,
  },
  leaderHighlight: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  leaderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
  },
  leaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  leaderEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  leaderName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaderPoints: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  completeSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  completeText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  endButton: {
    backgroundColor: colors.error,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
