import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform, Share } from 'react-native';
import QRCode from 'react-qr-code';
import { useTheme } from '../../lib/theme';

interface QRCodeDisplayProps {
  joinCode: string;
  gameId?: string;
  playerCount: number;
  joinedCount: number;
}

export function QRCodeDisplay({ joinCode, gameId, playerCount, joinedCount }: QRCodeDisplayProps) {
  const { colors, mode } = useTheme();
  const styles = createStyles(colors);
  const [showModal, setShowModal] = useState(false);

  // Generate join URL - will use actual domain when deployed
  const baseUrl = Platform.OS === 'web' 
    ? window.location.origin 
    : 'https://your-app.netlify.app'; // Replace when deployed
  const joinUrl = `${baseUrl}/join/${joinCode}`;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          title: 'Join Rung Game',
          text: `Join my Rung game with code: ${joinCode}`,
          url: joinUrl,
        });
      } else if (Platform.OS !== 'web') {
        await Share.share({
          message: `Join my Rung game!\n\nCode: ${joinCode}\n\nOr scan the QR code: ${joinUrl}`,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(joinUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <>
      {/* Compact Display */}
      <Pressable style={styles.compactContainer} onPress={() => setShowModal(true)}>
        <View style={styles.qrSmall}>
          <QRCode
            value={joinUrl}
            size={60}
            bgColor={colors.card}
            fgColor={colors.text}
          />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.joinCodeLabel}>Join Code</Text>
          <Text style={styles.joinCode}>{joinCode}</Text>
          <Text style={styles.joinStatus}>
            {joinedCount}/{playerCount} players joined
          </Text>
        </View>
        <Text style={styles.expandHint}>Tap to expand</Text>
      </Pressable>

      {/* Full Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Share Game</Text>
            <Text style={styles.modalSubtitle}>
              Players can scan this QR code to join and submit their calls
            </Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={joinUrl}
                size={200}
                bgColor={mode === 'light' ? '#FFFFFF' : colors.card}
                fgColor={mode === 'light' ? '#000000' : colors.text}
              />
            </View>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Join Code</Text>
              <Text style={styles.codeLarge}>{joinCode}</Text>
            </View>

            <Text style={styles.joinStatusLarge}>
              {joinedCount}/{playerCount} players have joined
            </Text>

            <View style={styles.buttonRow}>
              <Pressable style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>Share Link</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={() => setShowModal(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  compactContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrSmall: {
    backgroundColor: colors.card,
    padding: 4,
    borderRadius: 8,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  joinCodeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  joinCode: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 4,
  },
  joinStatus: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  expandHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  codeLarge: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 6,
  },
  joinStatusLarge: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
