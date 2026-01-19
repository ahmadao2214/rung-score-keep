import { Text, YStack, XStack } from '@tamagui/core';
import { Card } from '../ui/Card';
import { TrumpCard as TrumpCardType } from '../../utils/trump';
import { getSuitColor } from '../../utils/trump';

interface TrumpCardProps {
  trumpCard: TrumpCardType | null | undefined;
  roundNumber: number;
  numberOfPlayers: number;
}

/**
 * Display the trump card for the current round
 * Shows "No Trump" if entire deck is dealt
 */
export function TrumpCard({ trumpCard, roundNumber, numberOfPlayers }: TrumpCardProps) {
  const cardsRemaining = 52 - roundNumber * numberOfPlayers;

  if (cardsRemaining < 1 || trumpCard === null) {
    return (
      <Card padding="medium">
        <YStack gap={8} alignItems="center">
          <Text fontSize={16} fontWeight="bold">
            Trump
          </Text>
          <Text fontSize={14} color="$gray10">
            No Trump - Entire Deck Dealt
          </Text>
        </YStack>
      </Card>
    );
  }

  if (!trumpCard) {
    return (
      <Card padding="medium">
        <YStack gap={8} alignItems="center">
          <Text fontSize={16} fontWeight="bold">
            Trump
          </Text>
          <Text fontSize={14} color="$gray10">
            Loading...
          </Text>
        </YStack>
      </Card>
    );
  }

  const suitColor = getSuitColor(trumpCard.suit);

  return (
    <Card padding="medium">
      <YStack gap={12} alignItems="center">
        <Text fontSize={16} fontWeight="bold">
          Trump
        </Text>
        <XStack
          backgroundColor="$backgroundStrong"
          borderWidth={2}
          borderColor="$gray8"
          borderRadius={8}
          paddingHorizontal={20}
          paddingVertical={12}
          minWidth={80}
          justifyContent="center"
          alignItems="center"
        >
          <Text
            fontSize={32}
            fontWeight="bold"
            color={suitColor === 'red' ? '$red10' : '$gray12'}
          >
            {trumpCard.displayText}
          </Text>
        </XStack>
        <Text fontSize={12} color="$gray10" textAlign="center">
          {trumpCard.wasAutoAssigned
            ? 'Auto-assigned (verify with physical deck)'
            : 'Dealer verified'}
        </Text>
      </YStack>
    </Card>
  );
}
