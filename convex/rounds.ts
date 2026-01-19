import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

const trumpCardValidator = v.union(
  v.object({
    suit: v.union(
      v.literal('hearts'),
      v.literal('diamonds'),
      v.literal('clubs'),
      v.literal('spades')
    ),
    rank: v.union(
      v.literal('A'),
      v.literal('2'),
      v.literal('3'),
      v.literal('4'),
      v.literal('5'),
      v.literal('6'),
      v.literal('7'),
      v.literal('8'),
      v.literal('9'),
      v.literal('10'),
      v.literal('J'),
      v.literal('Q'),
      v.literal('K')
    ),
    displayText: v.string(),
    wasAutoAssigned: v.boolean(),
  }),
  v.null()
);

/**
 * Create a new round
 */
export const createRound = mutation({
  args: {
    gameId: v.id('games'),
    roundNumber: v.number(),
    trumpCard: v.optional(trumpCardValidator),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    // Create player rounds array
    const playerRounds = game.players.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      call: 0,
      handsWon: 0,
      points: 0,
      isDealer: player.position === game.dealerIndex,
    }));

    const roundId = await ctx.db.insert('rounds', {
      gameId: args.gameId,
      roundNumber: args.roundNumber,
      trumpCard: args.trumpCard,
      playerRounds,
      status: 'calling',
      currentPlayerIndex: (game.dealerIndex + 1) % game.numberOfPlayers,
    });

    return roundId;
  },
});

/**
 * Get rounds for a game
 */
export const getRoundsByGame = query({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('rounds')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .collect();
  },
});

/**
 * Get a specific round
 */
export const getRound = query({
  args: { roundId: v.id('rounds') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roundId);
  },
});

/**
 * Get a round by game and round number
 */
export const getRoundByNumber = query({
  args: {
    gameId: v.id('games'),
    roundNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const rounds = await ctx.db
      .query('rounds')
      .withIndex('by_game_and_round', (q) =>
        q.eq('gameId', args.gameId).eq('roundNumber', args.roundNumber)
      )
      .collect();
    return rounds[0] ?? null;
  },
});

/**
 * Set a player's call
 */
export const setPlayerCall = mutation({
  args: {
    roundId: v.id('rounds'),
    playerId: v.string(),
    call: v.number(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error('Round not found');

    // Validate call
    if (args.call < 0 || args.call > round.roundNumber) {
      throw new Error(`Call must be between 0 and ${round.roundNumber}`);
    }

    // Update player's call
    const updatedPlayerRounds = round.playerRounds.map((pr) =>
      pr.playerId === args.playerId ? { ...pr, call: args.call } : pr
    );

    // Check if all calls are set
    const allCallsSet = updatedPlayerRounds.every((pr) => pr.call !== undefined);

    await ctx.db.patch(args.roundId, {
      playerRounds: updatedPlayerRounds,
      ...(allCallsSet ? { status: 'playing' as const } : {}),
    });
  },
});

/**
 * Update hands won for a player
 */
export const updateHandsWon = mutation({
  args: {
    roundId: v.id('rounds'),
    playerId: v.string(),
    handsWon: v.number(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error('Round not found');

    // Validate hands won
    if (args.handsWon < 0 || args.handsWon > round.roundNumber) {
      throw new Error(`Hands won must be between 0 and ${round.roundNumber}`);
    }

    // Calculate points
    const playerRound = round.playerRounds.find(
      (pr) => pr.playerId === args.playerId
    );
    if (!playerRound) throw new Error('Player not found in round');

    const points = playerRound.call === args.handsWon
      ? calculatePoints(playerRound.call)
      : 0;

    // Update player's hands won and points
    const updatedPlayerRounds = round.playerRounds.map((pr) =>
      pr.playerId === args.playerId
        ? { ...pr, handsWon: args.handsWon, points }
        : pr
    );

    await ctx.db.patch(args.roundId, {
      playerRounds: updatedPlayerRounds,
    });
  },
});

/**
 * Complete a round
 */
export const completeRound = mutation({
  args: { roundId: v.id('rounds') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roundId, {
      status: 'completed',
    });
  },
});

/**
 * Update trump card (dealer override)
 */
export const updateTrumpCard = mutation({
  args: {
    roundId: v.id('rounds'),
    trumpCard: trumpCardValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roundId, {
      trumpCard: args.trumpCard,
    });
  },
});

/**
 * Helper function to calculate points based on call
 */
function calculatePoints(call: number): number {
  const scoringTable: Record<number, number> = {
    0: 5, 1: 10, 2: 15, 3: 20, 4: 25, 5: 30, 6: 35,
    7: 40, 8: 45, 9: 50, 10: 55, 11: 60, 12: 65, 13: 70,
  };
  return scoringTable[call] ?? 0;
}
