import { useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Text, YStack, XStack } from '@tamagui/core';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { calculatePoints } from '../../utils/scoring';

interface PlayerRound {
  playerId: string;
  playerName: string;
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
  const [handsWonState, setHandsWonState] = useState<{ [playerId: string]: number }>(
    playerRounds.reduce((acc, pr) => ({ ...acc, [pr.playerId]: pr.handsWon }), {})
  );

  const handleHandsWonChange = (playerId: string, delta: number) => {
    setHandsWonState(prev => {
      const current = prev[playerId] || 0;
      const newValue = Math.max(0, Math.min(roundNumber, current + delta));
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
    <ScrollView style={{ flex: 1 }}>
      <YStack padding={20} gap={20}>
        <Text fontSize={24} fontWeight="bold">
          Round {roundNumber} - Playing
        </Text>

        {/* Total Hands Counter */}
        <Card padding="medium">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize={16}>Total Hands Won:</Text>
            <Text
              fontSize={24}
              fontWeight="bold"
              color={isValidTotal ? '$green' : totalHandsWon > roundNumber ? '$red10' : '$blue10'}
            >
              {totalHandsWon} / {roundNumber}
            </Text>
          </XStack>
          {!isValidTotal && (
            <Text fontSize={14} color="$gray10" textAlign="center" marginTop={8}>
              {totalHandsWon > roundNumber
                ? 'Total exceeds round number!'
                : 'Total should equal round number'}
            </Text>
          )}
        </Card>

        {/* Player Hands Won Tracking */}
        {playerRounds.map(pr => {
          const handsWon = handsWonState[pr.playerId] || 0;
          const expectedPoints = calculatePoints(pr.call, handsWon);
          const isSuccess = handsWon === pr.call;

          return (
            <Card key={pr.playerId} padding="medium">
              <YStack gap={12}>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={18} fontWeight="600">
                    {pr.playerName}
                  </Text>
                  {pr.isDealer && (
                    <XStack backgroundColor="$green" paddingHorizontal={8} paddingVertical={4} borderRadius={4}>
                      <Text fontSize={12} fontWeight="bold" color="$white">
                        DEALER
                      </Text>
                    </XStack>
                  )}
                </XStack>

                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={14} color="$gray10">
                    Call: {pr.call}
                  </Text>
                  <Text
                    fontSize={14}
                    color={isSuccess ? '$green' : handsWon > pr.call ? '$red10' : '$gray10'}
                  >
                    Expected: {expectedPoints} pts
                  </Text>
                </XStack>

                {/* Hands Won Counter */}
                <XStack justifyContent="space-between" alignItems="center">
                  <Pressable
                    onPress={() => handleHandsWonChange(pr.playerId, -1)}
                    style={{
                      backgroundColor: '#f0f0f0',
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text fontSize={24} fontWeight="bold">
                      -
                    </Text>
                  </Pressable>

                  <YStack alignItems="center">
                    <Text fontSize={14} color="$gray10">
                      Hands Won
                    </Text>
                    <Text fontSize={32} fontWeight="bold" color="$blue10">
                      {handsWon}
                    </Text>
                  </YStack>

                  <Pressable
                    onPress={() => handleHandsWonChange(pr.playerId, 1)}
                    style={{
                      backgroundColor: '#007AFF',
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text fontSize={24} fontWeight="bold" color="#fff">
                      +
                    </Text>
                  </Pressable>
                </XStack>

                {/* Points Preview */}
                <XStack justifyContent="center">
                  <Text
                    fontSize={18}
                    fontWeight="bold"
                    color={isSuccess ? '$green' : '$gray10'}
                  >
                    {isSuccess ? `✓ ${expectedPoints} points` : '0 points'}
                  </Text>
                </XStack>
              </YStack>
            </Card>
          );
        })}

        {/* Complete Round Button */}
        <Button
          size="large"
          onPress={handleCompleteRound}
          disabled={!isValidTotal}
        >
          Complete Round
        </Button>

        {!isValidTotal && (
          <Text fontSize={14} color="$gray10" textAlign="center">
            Total hands won must equal {roundNumber} to continue
          </Text>
        )}

        <YStack height={40} />
      </YStack>
    </ScrollView>
  );
}
