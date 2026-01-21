import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { QRCodeDisplay } from './QRCodeDisplay';
import { useTheme } from '../../lib/theme';

interface Player {
  id: string;
  name: string;
  position: number;
  emoji?: string;
}

interface LobbyModeProps {
  joinCode: string;
  numberOfPlayers: number;
  players: Player[];
  onStartGame: (dealerIndex: number) => void;
}

export function LobbyMode({ joinCode, numberOfPlayers, players, onStartGame }: LobbyModeProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const joinedCount = players.length;
  const allJoined = joinedCount === numberOfPlayers;
  const [selectedDealer, setSelectedDealer] = React.useState(0);

  const handleStartGame = () => {
    if (allJoined) {
      onStartGame(selectedDealer);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Waiting for Players</Text>
        <Text style={styles.subtitle}>
          {joinedCount} of {numberOfPlayers} players joined
        </Text>
      </View>

      {/* QR Code */}
      <QRCodeDisplay
        joinCode={joinCode}
        playerCount={numberOfPlayers}
        joinedCount={joinedCount}
      />

      {/* Player List */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Players</Text>

        {players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerEmoji}>{player.emoji || '👤'}</Text>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerJoined}>✓</Text>
          </View>
        ))}

        {/* Empty slots */}
        {Array.from({ length: numberOfPlayers - joinedCount }).map((_, index) => (
          <View key={`empty-${index}`} style={[styles.playerRow, styles.playerRowEmpty]}>
            <Text style={styles.playerEmoji}>⏳</Text>
            <Text style={styles.playerNameEmpty}>Waiting...</Text>
          </View>
        ))}
      </View>

      {/* Dealer Selection (only show when all joined) */}
      {allJoined && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select First Dealer</Text>
          <Text style={styles.sectionSubtitle}>Who will deal the first hand?</Text>

          <View style={styles.dealerList}>
            {players.map((player, index) => (
              <Pressable
                key={player.id}
                onPress={() => setSelectedDealer(index)}
                style={[
                  styles.dealerOption,
                  selectedDealer === index && styles.dealerOptionActive,
                ]}
              >
                <View style={styles.dealerRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedDealer === index && styles.radioOuterActive,
                    ]}
                  >
                    {selectedDealer === index && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.dealerEmoji}>{player.emoji || '👤'}</Text>
                  <Text
                    style={[
                      styles.dealerText,
                      selectedDealer === index && styles.dealerTextActive,
                    ]}
                  >
                    {player.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Start Game Button */}
      {allJoined && (
        <Pressable style={styles.startButton} onPress={handleStartGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </Pressable>
      )}

      <View style={{ height: 40 }} />
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
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    marginBottom: 8,
  },
  playerRowEmpty: {
    opacity: 0.5,
  },
  playerEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  playerNameEmpty: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  playerJoined: {
    fontSize: 18,
    color: colors.accent,
  },
  dealerList: {
  },
  dealerOption: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  dealerOptionActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  dealerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  dealerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  dealerText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dealerTextActive: {
    color: colors.accent,
    fontWeight: '600',
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
