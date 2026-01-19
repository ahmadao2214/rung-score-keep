import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

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

    // Create player rounds array with -1 indicating no call yet
    const playerRounds = game.players.map((player) => ({
      playerId: player.id,
      playerName: player.name,
      playerEmoji: player.emoji || '👤',
      call: -1, // -1 indicates not yet called
      handsWon: 0,
      points: 0,
      isDealer: player.position === game.dealerIndex,
      callSubmittedBy: undefined,
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
 * Set a player's call (by scorekeeper)
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

    if (args.call < 0 || args.call > round.roundNumber) {
      throw new Error(`Call must be between 0 and ${round.roundNumber}`);
    }

    const updatedPlayerRounds = round.playerRounds.map((pr) =>
      pr.playerId === args.playerId 
        ? { ...pr, call: args.call, callSubmittedBy: 'scorekeeper' as const } 
        : pr
    );

    const allCallsSet = updatedPlayerRounds.every((pr) => pr.call >= 0);

    await ctx.db.patch(args.roundId, {
      playerRounds: updatedPlayerRounds,
      ...(allCallsSet ? { status: 'playing' as const } : {}),
    });
  },
});

/**
 * Player submits their own call via QR sync
 */
export const submitPlayerCall = mutation({
  args: {
    gameId: v.id('games'),
    roundNumber: v.number(),
    playerId: v.string(),
    call: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the current round
    const rounds = await ctx.db
      .query('rounds')
      .withIndex('by_game_and_round', (q) =>
        q.eq('gameId', args.gameId).eq('roundNumber', args.roundNumber)
      )
      .collect();

    const round = rounds[0];
    if (!round) throw new Error('Round not found');

    if (round.status !== 'calling') {
      throw new Error('Calling phase has ended');
    }

    if (args.call < 0 || args.call > round.roundNumber) {
      throw new Error(`Call must be between 0 and ${round.roundNumber}`);
    }

    // Find player and check if they already called
    const playerRound = round.playerRounds.find((pr) => pr.playerId === args.playerId);
    if (!playerRound) throw new Error('Player not found in round');

    if (playerRound.call >= 0) {
      throw new Error('You have already submitted your call');
    }

    // Update player's call
    const updatedPlayerRounds = round.playerRounds.map((pr) =>
      pr.playerId === args.playerId 
        ? { ...pr, call: args.call, callSubmittedBy: 'player' as const } 
        : pr
    );

    // Check if all calls are set
    const allCallsSet = updatedPlayerRounds.every((pr) => pr.call >= 0);

    await ctx.db.patch(round._id, {
      playerRounds: updatedPlayerRounds,
      ...(allCallsSet ? { status: 'playing' as const } : {}),
    });

    return { success: true };
  },
});

/**
 * Get current round status for a player (used by QR sync)
 */
export const getCurrentRoundForPlayer = query({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const rounds = await ctx.db
      .query('rounds')
      .withIndex('by_game_and_round', (q) =>
        q.eq('gameId', args.gameId).eq('roundNumber', game.currentRound)
      )
      .collect();

    const round = rounds[0];
    if (!round) return { game, round: null, playerRound: null };

    const playerRound = round.playerRounds.find((pr) => pr.playerId === args.playerId);

    return {
      game: {
        currentRound: game.currentRound,
        status: game.status,
        joinCode: game.joinCode,
      },
      round: {
        roundNumber: round.roundNumber,
        status: round.status,
        trumpCard: round.trumpCard,
      },
      playerRound: playerRound || null,
      allCalls: round.playerRounds.map((pr) => ({
        playerId: pr.playerId,
        playerName: pr.playerName,
        playerEmoji: pr.playerEmoji,
        hasCalled: pr.call >= 0,
        call: pr.call >= 0 ? pr.call : null,
      })),
    };
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

    if (args.handsWon < 0 || args.handsWon > round.roundNumber) {
      throw new Error(`Hands won must be between 0 and ${round.roundNumber}`);
    }

    const playerRound = round.playerRounds.find(
      (pr) => pr.playerId === args.playerId
    );
    if (!playerRound) throw new Error('Player not found in round');

    const points = playerRound.call === args.handsWon
      ? calculatePoints(playerRound.call)
      : 0;

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
