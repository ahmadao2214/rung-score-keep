import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CallingMode } from '../../components/game/CallingMode';
import { PlayingMode } from '../../components/game/PlayingMode';
import { ScorecardMode } from '../../components/game/ScorecardMode';
import { storageHelpers, StorageKeys } from '../../lib/mmkv';
import { TrumpCard as TrumpCardType } from '../../utils/trump';
import { useTheme } from '../../lib/theme';

type GameMode = 'calling' | 'playing' | 'scorecard';

interface Player {
  id: string;
  name: string;
  position: number;
  emoji?: string;
}

interface PlayerRound {
  playerId: string;
  playerName: string;
  playerEmoji: string;
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
  const { colors } = useTheme();
  const [game, setGame] = useState<Game | null>(null);
  const [mode, setMode] = useState<GameMode>('calling');
  const [loading, setLoading] = useState(true);

  const styles = createStyles(colors);

  useEffect(() => {
    const savedGame = storageHelpers.getObject<Game>(StorageKeys.CURRENT_GAME);
    
    if (savedGame) {
      setGame(savedGame);

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
      
      if (savedGame.id !== id) {
        router.replace(`/game/${savedGame.id}`);
      }
    } else {
      router.replace('/');
    }
    setLoading(false);
  }, [id, router]);

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
        playerEmoji: player.emoji || '👤',
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Game not found</Text>
      </View>
    );
  }

  const rounds = game.rounds || [];
  const currentRoundData = rounds.find(r => r.roundNumber === game.currentRound);

  return (
    <View style={styles.gameContainer}>
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
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
