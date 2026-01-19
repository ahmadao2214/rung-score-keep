import { useState } from 'react';
import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { SUITS, RANKS, Suit, Rank } from '../../utils/constants';
import { getSuitColor, formatTrumpCard } from '../../utils/trump';
import { useTheme } from '../../lib/theme';

interface TrumpCardPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (rank: Rank, suit: Suit) => void;
}

export function TrumpCardPicker({ visible, onClose, onSelect }: TrumpCardPickerProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [selectedRank, setSelectedRank] = useState<Rank>('A');
  const [selectedSuit, setSelectedSuit] = useState<Suit>('spades');

  const handleConfirm = () => {
    onSelect(selectedRank, selectedSuit);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Select Trump Card</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Rank</Text>
            <View style={styles.rankGrid}>
              {RANKS.map((rank) => (
                <Pressable
                  key={rank}
                  onPress={() => setSelectedRank(rank)}
                  style={[
                    styles.rankButton,
                    selectedRank === rank && styles.rankButtonSelected,
                  ]}
                >
                  <Text style={[
                    styles.rankText,
                    selectedRank === rank && styles.rankTextSelected,
                  ]}>
                    {rank}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Suit</Text>
            <View style={styles.suitRow}>
              {SUITS.map((suit) => {
                const suitColor = getSuitColor(suit);
                const displayText = formatTrumpCard('A', suit).slice(-1);

                return (
                  <Pressable
                    key={suit}
                    onPress={() => setSelectedSuit(suit)}
                    style={[
                      styles.suitButton,
                      selectedSuit === suit && styles.suitButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.suitText,
                      { color: selectedSuit === suit
                        ? '#FFFFFF'
                        : suitColor === 'red' ? '#E53935' : colors.text
                      }
                    ]}>
                      {displayText}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Selected Card</Text>
            <Text style={[
              styles.previewCard,
              { color: getSuitColor(selectedSuit) === 'red' ? '#E53935' : colors.text }
            ]}>
              {formatTrumpCard(selectedRank, selectedSuit)}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  rankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rankButton: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  rankButtonSelected: {
    backgroundColor: colors.accent,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  rankTextSelected: {
    color: '#FFFFFF',
  },
  suitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suitButton: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  suitButtonSelected: {
    backgroundColor: colors.accent,
  },
  suitText: {
    fontSize: 32,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  previewCard: {
    fontSize: 52,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
