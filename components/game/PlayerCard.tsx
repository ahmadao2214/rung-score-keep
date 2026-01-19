import { Text, YStack, XStack } from '@tamagui/core';
import { Card } from '../ui/Card';

interface PlayerCardProps {
  playerName: string;
  isDealer?: boolean;
  isCurrentTurn?: boolean;
  call?: number;
  handsWon?: number;
  points?: number;
  totalPoints?: number;
}

/**
 * Display a player's information in a card
 */
export function PlayerCard({
  playerName,
  isDealer = false,
  isCurrentTurn = false,
  call,
  handsWon,
  points,
  totalPoints,
}: PlayerCardProps) {
  return (
    <Card
      padding="medium"
      borderWidth={isCurrentTurn ? 3 : 1}
      borderColor={isCurrentTurn ? '$blue10' : '$borderColor'}
      backgroundColor={isCurrentTurn ? '$blue2' : '$backgroundStrong'}
    >
      <YStack gap={8}>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={18} fontWeight="bold">
            {playerName}
          </Text>
          {isDealer && (
            <XStack
              backgroundColor="$green"
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={4}
            >
              <Text fontSize={12} fontWeight="bold" color="$white">
                DEALER
              </Text>
            </XStack>
          )}
        </XStack>

        {(call !== undefined || handsWon !== undefined || points !== undefined) && (
          <XStack gap={16}>
            {call !== undefined && (
              <YStack>
                <Text fontSize={12} color="$gray10">
                  Call
                </Text>
                <Text fontSize={16} fontWeight="600">
                  {call}
                </Text>
              </YStack>
            )}

            {handsWon !== undefined && (
              <YStack>
                <Text fontSize={12} color="$gray10">
                  Won
                </Text>
                <Text fontSize={16} fontWeight="600">
                  {handsWon}
                </Text>
              </YStack>
            )}

            {points !== undefined && (
              <YStack>
                <Text fontSize={12} color="$gray10">
                  Points
                </Text>
                <Text fontSize={16} fontWeight="600">
                  {points}
                </Text>
              </YStack>
            )}

            {totalPoints !== undefined && (
              <YStack>
                <Text fontSize={12} color="$gray10">
                  Total
                </Text>
                <Text fontSize={18} fontWeight="bold" color="$blue10">
                  {totalPoints}
                </Text>
              </YStack>
            )}
          </XStack>
        )}
      </YStack>
    </Card>
  );
}
