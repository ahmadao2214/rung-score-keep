import { useState } from 'react';
import { ScrollView, Pressable, Alert } from 'react-native';
import { Text, YStack, XStack } from '@tamagui/core';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrumpCard } from './TrumpCard';
import { TrumpCardPicker } from './TrumpCardPicker';
import {
  calculateTotalCalls,
  getForbiddenDealerCall,
  getDealerCallErrorMessage,
} from '../../utils/validation';
import { generateRandomTrump, createManualTrump, TrumpCard as TrumpCardType } from '../../utils/trump';
import { Rank, Suit } from '../../utils/constants';

interface Player {
  id: string;
  name: string;
  position: number;
}

interface PlayerCall {
  playerId: string;
  call: number | null;
}

interface CallingModeProps {
  players: Player[];
  dealerIndex: number;
  roundNumber: number;
  numberOfPlayers: number;
  onComplete: (calls: { playerId: string; call: number }[], trumpCard: TrumpCardType | null) => void;
}

export function CallingMode({ players, dealerIndex, roundNumber, numberOfPlayers, onComplete }: CallingModeProps) {
  const [trumpCard, setTrumpCard] = useState<TrumpCardType | null>(() =>
    generateRandomTrump(roundNumber, numberOfPlayers)
  );
  const [showTrumpPicker, setShowTrumpPicker] = useState(false);
  const [playerCalls, setPlayerCalls] = useState<PlayerCall[]>(
    players.map(p => ({ playerId: p.id, call: null }))
  );

  // Determine calling order (clockwise from player after dealer)
  const callingOrder = [...Array(numberOfPlayers)].map((_, i) =>
    (dealerIndex + 1 + i) % numberOfPlayers
  );

  const currentCallIndex = playerCalls.filter(pc => pc.call !== null).length;
  const currentPlayerPosition = currentCallIndex < numberOfPlayers
    ? callingOrder[currentCallIndex]
    : -1;

  const isDealer = currentPlayerPosition === dealerIndex;
  const allCallsMade = playerCalls.every(pc => pc.call !== null);

  const handleSetCall = (playerId: string, call: number) => {
    // Validate if dealer
    if (isDealer) {
      const otherCalls = playerCalls
        .filter(pc => pc.playerId !== playerId && pc.call !== null)
        .map(pc => pc.call!);

      const forbiddenCall = getForbiddenDealerCall(otherCalls, roundNumber);
      if (forbiddenCall !== null && call === forbiddenCall) {
        Alert.alert('Invalid Call', getDealerCallErrorMessage(roundNumber));
        return;
      }
    }

    setPlayerCalls(prev =>
      prev.map(pc => pc.playerId === playerId ? { ...pc, call } : pc)
    );
  };

  const handleTrumpChange = (rank: Rank, suit: Suit) => {
    setTrumpCard(createManualTrump(rank, suit));
  };

  const handleStartPlaying = () => {
    const finalCalls = playerCalls.map(pc => ({
      playerId: pc.playerId,
      call: pc.call!,
    }));
    onComplete(finalCalls, trumpCard);
  };

  const totalCalls = calculateTotalCalls(
    playerCalls.filter(pc => pc.call !== null).map(pc => pc.call!)
  );

  const currentPlayer = players.find(p => p.position === currentPlayerPosition);

  return (
    <ScrollView style={{ flex: 1 }}>
      <YStack padding={20} gap={20}>
        <Text fontSize={24} fontWeight="bold">
          Round {roundNumber} - Calling Phase
        </Text>

        {/* Trump Card Display */}
        <TrumpCard
          trumpCard={trumpCard}
          roundNumber={roundNumber}
          numberOfPlayers={numberOfPlayers}
        />

        {trumpCard && (
          <Button variant="outline" size="small" onPress={() => setShowTrumpPicker(true)}>
            Change Trump (Dealer Override)
          </Button>
        )}

        {/* Current Player Indicator */}
        {!allCallsMade && currentPlayer && (
          <Card padding="medium" borderColor="$blue10" borderWidth={2}>
            <Text fontSize={18} fontWeight="600" textAlign="center">
              {currentPlayer.name}'s turn to call
              {isDealer && ' (Dealer)'}
            </Text>
          </Card>
        )}

        {/* Running Total */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={16}>Total Calls:</Text>
          <Text
            fontSize={24}
            fontWeight="bold"
            color={totalCalls === roundNumber ? '$red10' : '$blue10'}
          >
            {totalCalls}
          </Text>
        </XStack>

        {/* Player Call Entry */}
        {players.map((player, index) => {
          const playerCall = playerCalls.find(pc => pc.playerId === player.id);
          const isCurrent = player.position === currentPlayerPosition;
          const hasCalled = playerCall?.call !== null;

          return (
            <Card
              key={player.id}
              padding="medium"
              borderWidth={isCurrent ? 2 : 1}
              borderColor={isCurrent ? '$blue10' : '$borderColor'}
            >
              <YStack gap={12}>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize={18} fontWeight="600">
                    {player.name}
                  </Text>
                  {player.position === dealerIndex && (
                    <XStack backgroundColor="$green" paddingHorizontal={8} paddingVertical={4} borderRadius={4}>
                      <Text fontSize={12} fontWeight="bold" color="$white">
                        DEALER
                      </Text>
                    </XStack>
                  )}
                </XStack>

                {hasCalled ? (
                  <Text fontSize={20} fontWeight="bold" color="$blue10">
                    Called: {playerCall.call}
                  </Text>
                ) : isCurrent ? (
                  <XStack gap={8} flexWrap="wrap">
                    {Array.from({ length: roundNumber + 1 }, (_, i) => i).map(call => {
                      const otherCalls = playerCalls
                        .filter(pc => pc.playerId !== player.id && pc.call !== null)
                        .map(pc => pc.call!);
                      const forbiddenCall = isDealer
                        ? getForbiddenDealerCall(otherCalls, roundNumber)
                        : null;
                      const isForbidden = forbiddenCall !== null && call === forbiddenCall;

                      return (
                        <Pressable
                          key={call}
                          onPress={() => !isForbidden && handleSetCall(player.id, call)}
                          style={{
                            backgroundColor: isForbidden ? '#ffebee' : '#e3f2fd',
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 8,
                            borderWidth: isForbidden ? 2 : 0,
                            borderColor: '#f44336',
                            minWidth: 50,
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            fontSize={18}
                            fontWeight="600"
                            color={isForbidden ? '#f44336' : '#1976d2'}
                          >
                            {call}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </XStack>
                ) : (
                  <Text fontSize={16} color="$gray10">
                    Waiting...
                  </Text>
                )}
              </YStack>
            </Card>
          );
        })}

        {/* Start Playing Button */}
        {allCallsMade && (
          <Button size="large" onPress={handleStartPlaying}>
            Start Playing
          </Button>
        )}

        <YStack height={40} />
      </YStack>

      <TrumpCardPicker
        visible={showTrumpPicker}
        onClose={() => setShowTrumpPicker(false)}
        onSelect={handleTrumpChange}
      />
    </ScrollView>
  );
}
