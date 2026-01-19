import { ScrollView } from 'react-native';
import { Text, YStack, XStack } from '@tamagui/core';
import { Card } from '../ui/Card';

interface PlayerScore {
  playerName: string;
  calls: number[];
  points: number[];
  totalPoints: number;
}

interface ScoreTableProps {
  playerScores: PlayerScore[];
  currentRound: number;
}

/**
 * Full game scorecard table showing all rounds
 */
export function ScoreTable({ playerScores, currentRound }: ScoreTableProps) {
  const rounds = Array.from({ length: currentRound }, (_, i) => i + 1);

  return (
    <Card padding="small">
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <YStack gap={0}>
          {/* Header Row */}
          <XStack borderBottomWidth={2} borderColor="$borderColor" paddingBottom={8}>
            <YStack width={100} paddingHorizontal={8}>
              <Text fontSize={14} fontWeight="bold">
                Player
              </Text>
            </YStack>

            {rounds.map((round) => (
              <YStack key={round} width={60} alignItems="center">
                <Text fontSize={12} fontWeight="bold">
                  R{round}
                </Text>
              </YStack>
            ))}

            <YStack width={80} alignItems="center">
              <Text fontSize={14} fontWeight="bold">
                Total
              </Text>
            </YStack>
          </XStack>

          {/* Player Rows */}
          {playerScores.map((player, index) => (
            <XStack
              key={player.playerName}
              backgroundColor={index % 2 === 0 ? '$background' : '$backgroundStrong'}
              paddingVertical={12}
              borderBottomWidth={1}
              borderColor="$borderColor"
            >
              <YStack width={100} paddingHorizontal={8} justifyContent="center">
                <Text fontSize={14} fontWeight="600" numberOfLines={1}>
                  {player.playerName}
                </Text>
              </YStack>

              {rounds.map((round, roundIndex) => {
                const call = player.calls[roundIndex] ?? '-';
                const points = player.points[roundIndex] ?? 0;
                const hasData = player.calls[roundIndex] !== undefined;

                return (
                  <YStack key={round} width={60} alignItems="center" justifyContent="center">
                    {hasData ? (
                      <>
                        <Text fontSize={11} color="$gray10">
                          {call}
                        </Text>
                        <Text fontSize={13} fontWeight="600">
                          {points}
                        </Text>
                      </>
                    ) : (
                      <Text fontSize={13} color="$gray8">
                        -
                      </Text>
                    )}
                  </YStack>
                );
              })}

              <YStack width={80} alignItems="center" justifyContent="center">
                <Text fontSize={16} fontWeight="bold" color="$blue10">
                  {player.totalPoints}
                </Text>
              </YStack>
            </XStack>
          ))}
        </YStack>
      </ScrollView>
    </Card>
  );
}
