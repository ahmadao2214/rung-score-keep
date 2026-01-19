import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack } from '@tamagui/core';
import { CallingMode } from '../../components/game/CallingMode';
import { PlayingMode } from '../../components/game/PlayingMode';
import { ScorecardMode } from '../../components/game/ScorecardMode';
import { storageHelpers, StorageKeys } from '../../lib/mmkv';
import { TrumpCard as TrumpCardType } from '../../utils/trump';

type GameMode = 'calling' | 'playing' | 'scorecard';

interface Player {
  id: string;
  name: string;
  position: number;
}

interface PlayerRound {
  playerId: string;
  playerName: string;
  call: number;
  handsWon: number;
  points: number;
  isDealer: boolean;
}

interface Round {
  roundNumber: number;
  trumpCard: TrumpCardType | null;
  playerRounds: PlayerRound[];
  status: 'calling' | 'playing' | 'completed';
}

interface Game {
  id: string;
  numberOfPlayers: number;
  players: Player[];
  dealerIndex: number;
  currentRound: number;
  status: string;
  createdAt: number;
  rounds?: Round[];
}

export default function Game() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [mode, setMode] = useState<GameMode>('calling');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load game from MMKV
    const savedGame = storageHelpers.getObject<Game>(StorageKeys.CURRENT_GAME);
    if (savedGame && savedGame.id === id) {
      setGame(savedGame);

      // Determine initial mode based on current round status
      const rounds = savedGame.rounds || [];
      const currentRoundData = rounds.find(r => r.roundNumber === savedGame.currentRound);

      if (!currentRoundData) {
        setMode('calling');
      } else if (currentRoundData.status === 'calling') {
        setMode('calling');
      } else if (currentRoundData.status === 'playing') {
        setMode('playing');
      } else {
        setMode('scorecard');
      }
    }
    setLoading(false);
  }, [id]);

  const saveGame = (updatedGame: Game) => {
    setGame(updatedGame);
    storageHelpers.setObject(StorageKeys.CURRENT_GAME, updatedGame);
  };

  const handleCallingComplete = (
    calls: { playerId: string; call: number }[],
    trumpCard: TrumpCardType | null
  ) => {
    if (!game) return;

    const playerRounds: PlayerRound[] = game.players.map(player => {
      const call = calls.find(c => c.playerId === player.id)?.call || 0;
      return {
        playerId: player.id,
        playerName: player.name,
        call,
        handsWon: 0,
        points: 0,
        isDealer: player.position === game.dealerIndex,
      };
    });

    const newRound: Round = {
      roundNumber: game.currentRound,
      trumpCard,
      playerRounds,
      status: 'playing',
    };

    const rounds = game.rounds || [];
    const existingRoundIndex = rounds.findIndex(r => r.roundNumber === game.currentRound);

    const updatedRounds = existingRoundIndex >= 0
      ? rounds.map((r, i) => i === existingRoundIndex ? newRound : r)
      : [...rounds, newRound];

    saveGame({ ...game, rounds: updatedRounds });
    setMode('playing');
  };

  const handlePlayingComplete = (updatedPlayerRounds: PlayerRound[]) => {
    if (!game) return;

    const rounds = game.rounds || [];
    const updatedRounds = rounds.map(r =>
      r.roundNumber === game.currentRound
        ? { ...r, playerRounds: updatedPlayerRounds, status: 'completed' as const }
        : r
    );

    saveGame({ ...game, rounds: updatedRounds });
    setMode('scorecard');
  };

  const handleStartNextRound = () => {
    if (!game) return;

    const nextRound = game.currentRound + 1;
    if (nextRound > 13) return;

    saveGame({ ...game, currentRound: nextRound });
    setMode('calling');
  };

  const handleEndGame = () => {
    if (!game) return;

    saveGame({ ...game, status: 'completed' });
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <Text>Game not found</Text>
      </View>
    );
  }

  const rounds = game.rounds || [];
  const currentRoundData = rounds.find(r => r.roundNumber === game.currentRound);

  return (
    <YStack flex={1} backgroundColor="$background">
      {mode === 'calling' && (
        <CallingMode
          players={game.players}
          dealerIndex={game.dealerIndex}
          roundNumber={game.currentRound}
          numberOfPlayers={game.numberOfPlayers}
          onComplete={handleCallingComplete}
        />
      )}

      {mode === 'playing' && currentRoundData && (
        <PlayingMode
          playerRounds={currentRoundData.playerRounds}
          roundNumber={game.currentRound}
          onComplete={handlePlayingComplete}
        />
      )}

      {mode === 'scorecard' && (
        <ScorecardMode
          players={game.players}
          rounds={rounds}
          currentRound={game.currentRound}
          onStartNextRound={handleStartNextRound}
          onEndGame={handleEndGame}
        />
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
