import { SCORING_TABLE } from './constants';

/**
 * Calculate points for a player based on their call and hands won
 * Points are only awarded if handsWon === call
 */
export function calculatePoints(call: number, handsWon: number): number {
  if (call === handsWon) {
    return SCORING_TABLE[call] || 0;
  }
  return 0;
}

/**
 * Calculate the score for a call (assumes the player makes their call)
 */
export function getScoreForCall(call: number): number {
  return SCORING_TABLE[call] || 0;
}

/**
 * Validate that call is within valid range for the round
 */
export function isValidCall(call: number, roundNumber: number): boolean {
  return call >= 0 && call <= roundNumber;
}

/**
 * Validate that hands won is within valid range
 */
export function isValidHandsWon(handsWon: number, roundNumber: number): boolean {
  return handsWon >= 0 && handsWon <= roundNumber;
}
