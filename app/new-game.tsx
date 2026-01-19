import { useState } from 'react';
import { ScrollView, Pressable, Alert } from 'react-native';
import { Text, YStack, XStack } from '@tamagui/core';
import { useRouter } from 'expo-router';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { validatePlayerNames, isValidPlayerCount, isValidDealerIndex } from '../utils/validation';
import { storageHelpers, StorageKeys } from '../lib/mmkv';

export default function NewGame() {
  const router = useRouter();
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(4).fill('').map((_, i) => `Player ${i + 1}`)
  );
  const [dealerIndex, setDealerIndex] = useState(0);
  const [errors, setErrors] = useState<{ players?: string; general?: string }>({});

  // Update player names array when number of players changes
  const handlePlayerCountChange = (count: number) => {
    if (!isValidPlayerCount(count)) return;

    setNumberOfPlayers(count);
    const newNames = Array(count).fill('').map((_, i) =>
      playerNames[i] || `Player ${i + 1}`
    );
    setPlayerNames(newNames);

    // Adjust dealer index if needed
    if (dealerIndex >= count) {
      setDealerIndex(count - 1);
    }
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
    setErrors({}); // Clear errors when user makes changes
  };

  const handleStartGame = () => {
    // Validate inputs
    const nameValidation = validatePlayerNames(playerNames);
    if (!nameValidation.isValid) {
      setErrors({ players: nameValidation.error });
      Alert.alert('Validation Error', nameValidation.error);
      return;
    }

    if (!isValidDealerIndex(dealerIndex, numberOfPlayers)) {
      setErrors({ general: 'Invalid dealer selection' });
      Alert.alert('Validation Error', 'Please select a valid dealer');
      return;
    }

    // Create game object (will be saved to Convex when available)
    const game = {
      id: `game_${Date.now()}`,
      numberOfPlayers,
      players: playerNames.map((name, index) => ({
        id: `player_${Date.now()}_${index}`,
        name: name.trim(),
        position: index,
      })),
      dealerIndex,
      currentRound: 1,
      status: 'in_progress',
      createdAt: Date.now(),
    };

    // Save to MMKV for offline-first
    storageHelpers.setObject(StorageKeys.CURRENT_GAME, game);

    // Navigate to game screen
    router.push(`/game/${game.id}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <YStack padding={20} gap={20}>
        <Text fontSize={24} fontWeight="bold">
          Setup New Game
        </Text>

        {/* Number of Players */}
        <Card>
          <YStack gap={12}>
            <Text fontSize={18} fontWeight="600">
              Number of Players
            </Text>
            <XStack gap={8} flexWrap="wrap">
              {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                <Pressable
                  key={count}
                  onPress={() => handlePlayerCountChange(count)}
                  style={{
                    backgroundColor: numberOfPlayers === count ? '#007AFF' : '#f0f0f0',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 8,
                    minWidth: 50,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    fontSize={18}
                    fontWeight="600"
                    color={numberOfPlayers === count ? '#fff' : '#000'}
                  >
                    {count}
                  </Text>
                </Pressable>
              ))}
            </XStack>
          </YStack>
        </Card>

        {/* Player Names */}
        <Card>
          <YStack gap={12}>
            <Text fontSize={18} fontWeight="600">
              Player Names
            </Text>
            {errors.players && (
              <Text fontSize={14} color="$red10">
                {errors.players}
              </Text>
            )}
            {playerNames.map((name, index) => (
              <YStack key={index} gap={4}>
                <Text fontSize={14} color="$gray10">
                  Player {index + 1}
                </Text>
                <Input
                  value={name}
                  onChangeText={(text) => handlePlayerNameChange(index, text)}
                  placeholder={`Player ${index + 1} name`}
                  autoCapitalize="words"
                />
              </YStack>
            ))}
          </YStack>
        </Card>

        {/* Dealer Selection */}
        <Card>
          <YStack gap={12}>
            <Text fontSize={18} fontWeight="600">
              Select Dealer
            </Text>
            <XStack gap={8} flexWrap="wrap">
              {playerNames.map((name, index) => (
                <Pressable
                  key={index}
                  onPress={() => setDealerIndex(index)}
                  style={{
                    backgroundColor: dealerIndex === index ? '#2e7d32' : '#f0f0f0',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    flex: 1,
                    minWidth: 100,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    fontSize={16}
                    fontWeight="600"
                    color={dealerIndex === index ? '#fff' : '#000'}
                    numberOfLines={1}
                  >
                    {name || `Player ${index + 1}`}
                  </Text>
                </Pressable>
              ))}
            </XStack>
          </YStack>
        </Card>

        {/* Start Game Button */}
        <Button size="large" onPress={handleStartGame}>
          Start Game
        </Button>

        <YStack height={40} />
      </YStack>
    </ScrollView>
  );
}
