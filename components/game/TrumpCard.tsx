import { View, Text, StyleSheet } from 'react-native';
import { TrumpCard as TrumpCardType } from '../../utils/trump';
import { getSuitColor } from '../../utils/trump';
import { useTheme } from '../../lib/theme';

interface TrumpCardProps {
  trumpCard: TrumpCardType | null | undefined;
  roundNumber: number;
  numberOfPlayers: number;
}

export function TrumpCard({ trumpCard, roundNumber, numberOfPlayers }: TrumpCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const cardsRemaining = 52 - roundNumber * numberOfPlayers;

  if (cardsRemaining < 1 || trumpCard === null) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Trump</Text>
        <Text style={styles.subtitle}>No Trump - Entire Deck Dealt</Text>
      </View>
    );
  }

  if (!trumpCard) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Trump</Text>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    );
  }

  const suitColor = getSuitColor(trumpCard.suit);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Trump</Text>
      <View style={styles.trumpDisplay}>
        <Text style={[
          styles.trumpText,
          { color: suitColor === 'red' ? '#E53935' : colors.text }
        ]}>
          {trumpCard.displayText}
        </Text>
      </View>
      <Text style={styles.hint}>
        {trumpCard.wasAutoAssigned
          ? 'Auto-assigned (verify with physical deck)'
          : 'Dealer verified'}
      </Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  trumpDisplay: {
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trumpText: {
    fontSize: 36,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
