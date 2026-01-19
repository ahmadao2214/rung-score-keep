import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

interface PlayerScore {
  playerId: string;
  playerName: string;
  emoji: string;
  roundData: { call: number; points: number }[];
  totalPoints: number;
}

interface ScoreTableProps {
  playerScores: PlayerScore[];
  currentRound: number;
}

export function ScoreTable({ playerScores, currentRound }: ScoreTableProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const rounds = Array.from({ length: currentRound }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          <View style={styles.headerRow}>
            <View style={styles.playerCell}>
              <Text style={styles.headerText}>Player</Text>
            </View>
            {rounds.map((round) => (
              <View key={round} style={styles.roundCell}>
                <Text style={styles.headerText}>R{round}</Text>
              </View>
            ))}
            <View style={styles.totalCell}>
              <Text style={styles.headerText}>Total</Text>
            </View>
          </View>

          {playerScores.map((player, index) => (
            <View
              key={player.playerId}
              style={[
                styles.dataRow,
                index % 2 === 0 ? styles.rowEven : styles.rowOdd,
              ]}
            >
              <View style={styles.playerCell}>
                <Text style={styles.emoji}>{player.emoji}</Text>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.playerName}
                </Text>
              </View>

              {rounds.map((round, roundIndex) => {
                const data = player.roundData[roundIndex];
                const hasData = data !== undefined;
                const madeCall = hasData && data.points > 0;

                return (
                  <View key={round} style={styles.roundCell}>
                    {hasData ? (
                      <View style={styles.roundData}>
                        <Text style={styles.callText}>{data.call}</Text>
                        <Text style={[
                          styles.pointsText,
                          madeCall && styles.pointsSuccess
                        ]}>
                          {data.points}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>-</Text>
                    )}
                  </View>
                );
              })}

              <View style={styles.totalCell}>
                <Text style={styles.totalText}>{player.totalPoints}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowEven: {
    backgroundColor: colors.card,
  },
  rowOdd: {
    backgroundColor: colors.cardAlt,
  },
  playerCell: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  roundCell: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  totalCell: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.cardAlt,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  roundData: {
    alignItems: 'center',
  },
  callText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pointsText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  pointsSuccess: {
    color: colors.accent,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  totalText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.accent,
  },
});
