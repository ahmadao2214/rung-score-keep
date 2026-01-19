import { ScrollView } from 'react-native';
import { Text, YStack } from '@tamagui/core';
import { Button } from '../ui/Button';
import { ScoreTable } from './ScoreTable';

interface Player {
  id: string;
  name: string;
  position: number;
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
  // Calculate player scores for the table
  const playerScores = players.map(player => {
    const calls: number[] = [];
    const points: number[] = [];
    let totalPoints = 0;

    for (let i = 1; i <= currentRound; i++) {
      const round = rounds.find(r => r.roundNumber === i);
      const playerRound = round?.playerRounds.find(pr => pr.playerId === player.id);

      if (playerRound) {
        calls.push(playerRound.call);
        points.push(playerRound.points);
        totalPoints += playerRound.points;
      } else {
        calls.push(-1); // Placeholder for incomplete rounds
        points.push(0);
      }
    }

    return {
      playerName: player.name,
      calls,
      points,
      totalPoints,
    };
  });

  // Find winner
  const winner = playerScores.reduce((max, player) =>
    player.totalPoints > max.totalPoints ? player : max
  );

  const isGameComplete = currentRound >= 13;

  return (
    <ScrollView style={{ flex: 1 }}>
      <YStack padding={20} gap={20}>
        <Text fontSize={24} fontWeight="bold">
          Scorecard
        </Text>

        {/* Score Table */}
        <ScoreTable playerScores={playerScores} currentRound={currentRound} />

        {/* Current Leader */}
        <YStack alignItems="center" gap={8}>
          <Text fontSize={16} color="$gray10">
            {isGameComplete ? 'Winner' : 'Current Leader'}
          </Text>
          <Text fontSize={28} fontWeight="bold" color="$green">
            {winner.playerName}
          </Text>
          <Text fontSize={20} fontWeight="600" color="$blue10">
            {winner.totalPoints} points
          </Text>
        </YStack>

        {/* Next Round or End Game */}
        {isGameComplete ? (
          <>
            <Text fontSize={18} textAlign="center" marginVertical={12}>
              Game Complete! 🎉
            </Text>
            <Button size="large" onPress={onEndGame}>
              End Game
            </Button>
          </>
        ) : (
          <Button size="large" onPress={onStartNextRound}>
            Start Round {currentRound + 1}
          </Button>
        )}

        <YStack height={40} />
      </YStack>
    </ScrollView>
  );
}
