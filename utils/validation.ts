/**
 * CRITICAL VALIDATION RULE: Total calls cannot equal round number
 * This ensures someone will always fail to make their exact call
 */

/**
 * Calculate the sum of all player calls
 */
export function calculateTotalCalls(calls: number[]): number {
  return calls.reduce((sum, call) => sum + call, 0);
}

/**
 * Check if total calls equals round number (INVALID state)
 */
export function isTotalCallsEqualToRound(calls: number[], roundNumber: number): boolean {
  const total = calculateTotalCalls(calls);
  return total === roundNumber;
}

/**
 * Calculate which call value would be forbidden for the dealer
 * Returns the forbidden call value, or null if no restriction
 */
export function getForbiddenDealerCall(
  otherPlayerCalls: number[],
  roundNumber: number
): number | null {
  const currentTotal = calculateTotalCalls(otherPlayerCalls);
  const forbiddenCall = roundNumber - currentTotal;

  // The forbidden call must be within valid range (0 to roundNumber)
  if (forbiddenCall >= 0 && forbiddenCall <= roundNumber) {
    return forbiddenCall;
  }

  return null;
}

/**
 * Validate dealer's call (ensures total ≠ round number)
 */
export function isValidDealerCall(
  dealerCall: number,
  otherPlayerCalls: number[],
  roundNumber: number
): boolean {
  const forbiddenCall = getForbiddenDealerCall(otherPlayerCalls, roundNumber);
  return forbiddenCall === null || dealerCall !== forbiddenCall;
}

/**
 * Get error message for invalid dealer call
 */
export function getDealerCallErrorMessage(roundNumber: number): string {
  return `Total calls cannot equal ${roundNumber}. Please choose a different call.`;
}

/**
 * Validate player names are unique and non-empty
 */
export function validatePlayerNames(names: string[]): {
  isValid: boolean;
  error?: string;
} {
  // Check for empty names
  if (names.some(name => !name.trim())) {
    return {
      isValid: false,
      error: 'All player names must be filled in',
    };
  }

  // Check for duplicates
  const uniqueNames = new Set(names.map(n => n.trim().toLowerCase()));
  if (uniqueNames.size !== names.length) {
    return {
      isValid: false,
      error: 'Player names must be unique',
    };
  }

  return { isValid: true };
}

/**
 * Validate number of players
 */
export function isValidPlayerCount(count: number): boolean {
  return count >= 2 && count <= 8;
}

/**
 * Validate dealer index
 */
export function isValidDealerIndex(index: number, playerCount: number): boolean {
  return index >= 0 && index < playerCount;
}
