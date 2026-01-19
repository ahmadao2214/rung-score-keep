import { SUITS, RANKS, SUIT_SYMBOLS, TOTAL_CARDS, Suit, Rank } from './constants';

export interface TrumpCard {
  suit: Suit;
  rank: Rank;
  displayText: string;
  wasAutoAssigned: boolean;
}

/**
 * Calculate how many cards remain after dealing
 * Formula: 52 - (roundNumber × numberOfPlayers)
 */
export function getCardsRemaining(roundNumber: number, numberOfPlayers: number): number {
  const cardsDealt = roundNumber * numberOfPlayers;
  return TOTAL_CARDS - cardsDealt;
}

/**
 * Check if there are cards remaining for a trump card
 */
export function hasTrumpCard(roundNumber: number, numberOfPlayers: number): boolean {
  return getCardsRemaining(roundNumber, numberOfPlayers) >= 1;
}

/**
 * Generate a random trump card for the round
 * Returns null if no cards remain (entire deck dealt)
 *
 * NOTE: This is a simulation for speed. The actual trump card in the physical
 * game is the top card of the remaining deck AFTER dealing. The app doesn't
 * know which cards players have, so dealer should verify and update via override.
 */
export function generateRandomTrump(
  roundNumber: number,
  numberOfPlayers: number
): TrumpCard | null {
  const cardsRemaining = getCardsRemaining(roundNumber, numberOfPlayers);

  // Check if there are cards left for trump
  if (cardsRemaining < 1) {
    return null; // No trump this round
  }

  // Generate random suit and rank
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];

  return {
    suit,
    rank,
    displayText: formatTrumpCard(rank, suit),
    wasAutoAssigned: true,
  };
}

/**
 * Format a trump card for display
 */
export function formatTrumpCard(rank: Rank, suit: Suit): string {
  return `${rank}${SUIT_SYMBOLS[suit]}`;
}

/**
 * Create a trump card object from manual selection (dealer override)
 */
export function createManualTrump(rank: Rank, suit: Suit): TrumpCard {
  return {
    suit,
    rank,
    displayText: formatTrumpCard(rank, suit),
    wasAutoAssigned: false,
  };
}

/**
 * Get the color for a suit (for UI styling)
 */
export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

/**
 * Validate if the trump card selection is valid
 */
export function isValidTrumpCard(rank: Rank, suit: Suit): boolean {
  return RANKS.includes(rank) && SUITS.includes(suit);
}
