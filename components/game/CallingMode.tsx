import { useState } from 'react';
import { ScrollView, Pressable, Alert, View, Text, StyleSheet } from 'react-native';
import { TrumpCard } from './TrumpCard';
import { TrumpCardPicker } from './TrumpCardPicker';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  calculateTotalCalls,
  getForbiddenDealerCall,
  getDealerCallErrorMessage,
} from '../../utils/validation';
import { generateRandomTrump, createManualTrump, TrumpCard as TrumpCardType } from '../../utils/trump';
import { Rank, Suit } from '../../utils/constants';
import { useTheme } from '../../lib/theme';

interface Player {
  id: string;
  name: string;
  position: number;
  emoji?: string;
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
  joinCode?: string;
  joinedPlayerCount?: number;
  onComplete: (calls: { playerId: string; call: number }[], trumpCard: TrumpCardType | null) => void;
}

export function CallingMode({ players, dealerIndex, roundNumber, numberOfPlayers, joinCode, joinedPlayerCount = 0, onComplete }: CallingModeProps) {
  const { colors } = useTheme();
  const [trumpCard, setTrumpCard] = useState<TrumpCardType | null>(() =>
    generateRandomTrump(roundNumber, numberOfPlayers)
  );
  const [showTrumpPicker, setShowTrumpPicker] = useState(false);
  const [playerCalls, setPlayerCalls] = useState<PlayerCall[]>(
    players.map(p => ({ playerId: p.id, call: null }))
  );
  const styles = createStyles(colors);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roundTitle}>Round {roundNumber}</Text>
        <View style={styles.phaseBadge}>
          <Text style={styles.phaseBadgeText}>Calling</Text>
        </View>
      </View>

      {/* QR Code for player sync */}
      {joinCode && (
        <QRCodeDisplay
          joinCode={joinCode}
          playerCount={numberOfPlayers}
          joinedCount={joinedPlayerCount}
        />
      )}

      {/* Trump Card Display */}
      <TrumpCard
        trumpCard={trumpCard}
        roundNumber={roundNumber}
        numberOfPlayers={numberOfPlayers}
      />

      {trumpCard && (
        <Pressable style={styles.changeTrumpButton} onPress={() => setShowTrumpPicker(true)}>
          <Text style={styles.changeTrumpText}>Change Trump</Text>
        </Pressable>
      )}

      {/* Current Player Indicator */}
      {!allCallsMade && currentPlayer && (
        <View style={styles.currentPlayerCard}>
          <Text style={styles.currentPlayerText}>
            {currentPlayer.name}'s turn
            {isDealer && (
              <Text style={styles.dealerNote}> (Dealer)</Text>
            )}
          </Text>
        </View>
      )}

      {/* Running Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Calls</Text>
        <Text style={[
          styles.totalNumber,
          totalCalls === roundNumber ? styles.totalDanger : styles.totalNormal
        ]}>
          {totalCalls}
        </Text>
      </View>

      {/* Player Call Cards */}
      {players.map((player) => {
        const playerCall = playerCalls.find(pc => pc.playerId === player.id);
        const isCurrent = player.position === currentPlayerPosition;
        const hasCalled = playerCall?.call !== null;
        const isPlayerDealer = player.position === dealerIndex;

        const otherCalls = playerCalls
          .filter(pc => pc.playerId !== player.id && pc.call !== null)
          .map(pc => pc.call!);
        const forbiddenCall = isCurrent && isDealer
          ? getForbiddenDealerCall(otherCalls, roundNumber)
          : null;

        return (
          <View 
            key={player.id} 
            style={[styles.playerCard, isCurrent && styles.playerCardActive]}
          >
            <View style={styles.playerHeader}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerEmoji}>{player.emoji || '👤'}</Text>
                <Text style={styles.playerName}>{player.name}</Text>
                {isPlayerDealer && (
                  <View style={styles.dealerBadge}>
                    <Text style={styles.dealerBadgeText}>D</Text>
                  </View>
                )}
              </View>
              {hasCalled && (
                <View style={styles.calledBadge}>
                  <Text style={styles.calledNumber}>{playerCall.call}</Text>
                </View>
              )}
            </View>

            {hasCalled ? (
              <View style={styles.calledRow}>
                <Text style={styles.calledLabel}>Called {playerCall.call}</Text>
              </View>
            ) : isCurrent ? (
              <View style={styles.callOptions}>
                {Array.from({ length: roundNumber + 1 }, (_, i) => i).map(call => {
                  const isForbidden = forbiddenCall !== null && call === forbiddenCall;

                  return (
                    <Pressable
                      key={call}
                      onPress={() => !isForbidden && handleSetCall(player.id, call)}
                      style={[
                        styles.callButton,
                        isForbidden && styles.callButtonForbidden,
                      ]}
                    >
                      <Text style={[
                        styles.callButtonText,
                        isForbidden && styles.callButtonTextForbidden,
                      ]}>
                        {call}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.waitingText}>Waiting...</Text>
            )}
          </View>
        );
      })}

      {/* Start Playing Button */}
      {allCallsMade && (
        <Pressable style={styles.startButton} onPress={handleStartPlaying}>
          <Text style={styles.startButtonText}>Start Playing</Text>
        </Pressable>
      )}

      <View style={{ height: 40 }} />

      <TrumpCardPicker
        visible={showTrumpPicker}
        onClose={() => setShowTrumpPicker(false)}
        onSelect={handleTrumpChange}
      />
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  roundTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginRight: 12,
  },
  phaseBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phaseBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  changeTrumpButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  changeTrumpText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  currentPlayerCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  currentPlayerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  dealerNote: {
    fontWeight: '400',
    color: colors.textMuted,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
  },
  totalNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  totalNormal: {
    color: colors.accent,
  },
  totalDanger: {
    color: colors.error,
  },
  playerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerCardActive: {
    borderColor: colors.accent,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  dealerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calledBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  calledNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  calledRow: {
    alignItems: 'center',
  },
  calledLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.accent,
  },
  callOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  callButton: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 52,
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  callButtonForbidden: {
    backgroundColor: colors.error + '20',
    borderWidth: 2,
    borderColor: colors.error,
  },
  callButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  callButtonTextForbidden: {
    color: colors.error,
  },
  waitingText: {
    fontSize: 15,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  startButton: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
