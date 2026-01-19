import { useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { Text, YStack, XStack } from '@tamagui/core';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SUITS, RANKS, Suit, Rank } from '../../utils/constants';
import { getSuitColor, formatTrumpCard } from '../../utils/trump';

interface TrumpCardPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (rank: Rank, suit: Suit) => void;
}

/**
 * Modal picker for selecting trump card (dealer override)
 */
export function TrumpCardPicker({ visible, onClose, onSelect }: TrumpCardPickerProps) {
  const [selectedRank, setSelectedRank] = useState<Rank>('A');
  const [selectedSuit, setSelectedSuit] = useState<Suit>('spades');

  const handleConfirm = () => {
    onSelect(selectedRank, selectedSuit);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <YStack
        flex={1}
        backgroundColor="rgba(0,0,0,0.5)"
        justifyContent="center"
        alignItems="center"
        padding={20}
      >
        <Card padding="large" width="90%" maxWidth={400}>
          <YStack gap={20}>
            <Text fontSize={20} fontWeight="bold" textAlign="center">
              Select Trump Card
            </Text>

            {/* Rank Selection */}
            <YStack gap={8}>
              <Text fontSize={16} fontWeight="600">
                Rank
              </Text>
              <XStack flexWrap="wrap" gap={8}>
                {RANKS.map((rank) => (
                  <Pressable
                    key={rank}
                    onPress={() => setSelectedRank(rank)}
                    style={{
                      backgroundColor: selectedRank === rank ? '#007AFF' : '#f0f0f0',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 6,
                      minWidth: 45,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      fontSize={16}
                      fontWeight="600"
                      color={selectedRank === rank ? '#fff' : '#000'}
                    >
                      {rank}
                    </Text>
                  </Pressable>
                ))}
              </XStack>
            </YStack>

            {/* Suit Selection */}
            <YStack gap={8}>
              <Text fontSize={16} fontWeight="600">
                Suit
              </Text>
              <XStack gap={12} justifyContent="space-around">
                {SUITS.map((suit) => {
                  const suitColor = getSuitColor(suit);
                  const displayText = formatTrumpCard('A', suit).slice(-1);

                  return (
                    <Pressable
                      key={suit}
                      onPress={() => setSelectedSuit(suit)}
                      style={{
                        backgroundColor: selectedSuit === suit ? '#007AFF' : '#f0f0f0',
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                        flex: 1,
                      }}
                    >
                      <Text
                        fontSize={32}
                        color={
                          selectedSuit === suit
                            ? '#fff'
                            : suitColor === 'red'
                            ? '#dc2626'
                            : '#000'
                        }
                      >
                        {displayText}
                      </Text>
                    </Pressable>
                  );
                })}
              </XStack>
            </YStack>

            {/* Preview */}
            <YStack gap={8} alignItems="center" paddingVertical={12}>
              <Text fontSize={14} color="$gray10">
                Selected Card
              </Text>
              <Text
                fontSize={48}
                fontWeight="bold"
                color={getSuitColor(selectedSuit) === 'red' ? '$red10' : '$gray12'}
              >
                {formatTrumpCard(selectedRank, selectedSuit)}
              </Text>
            </YStack>

            {/* Action Buttons */}
            <XStack gap={12}>
              <Button variant="outline" onPress={onClose} flex={1}>
                Cancel
              </Button>
              <Button onPress={handleConfirm} flex={1}>
                Confirm
              </Button>
            </XStack>
          </YStack>
        </Card>
      </YStack>
    </Modal>
  );
}
