import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

/**
 * Create a new game
 */
export const createGame = mutation({
  args: {
    numberOfPlayers: v.number(),
    players: v.array(v.object({ name: v.string() })),
    dealerIndex: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (args.numberOfPlayers < 2 || args.numberOfPlayers > 8) {
      throw new Error('Number of players must be between 2 and 8');
    }

    if (args.players.length !== args.numberOfPlayers) {
      throw new Error('Number of player names must match numberOfPlayers');
    }

    if (args.dealerIndex < 0 || args.dealerIndex >= args.numberOfPlayers) {
      throw new Error('Invalid dealer index');
    }

    // Create player objects with IDs and positions
    const players = args.players.map((player, index) => ({
      id: `player_${Date.now()}_${index}`,
      name: player.name,
      position: index,
    }));

    // Create the game
    const gameId = await ctx.db.insert('games', {
      status: 'in_progress',
      createdAt: Date.now(),
      numberOfPlayers: args.numberOfPlayers,
      dealerIndex: args.dealerIndex,
      currentRound: 1,
      players,
    });

    return gameId;
  },
});

/**
 * Get a game by ID
 */
export const getGame = query({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

/**
 * Get all active games
 */
export const getActiveGames = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('games')
      .filter((q) => q.neq(q.field('status'), 'completed'))
      .collect();
  },
});

/**
 * Update game status
 */
export const updateGameStatus = mutation({
  args: {
    gameId: v.id('games'),
    status: v.union(
      v.literal('setup'),
      v.literal('in_progress'),
      v.literal('completed')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, {
      status: args.status,
      ...(args.status === 'completed' ? { completedAt: Date.now() } : {}),
    });
  },
});

/**
 * Advance to next round
 */
export const advanceRound = mutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    if (game.currentRound >= 13) {
      throw new Error('Game is already at the final round');
    }

    await ctx.db.patch(args.gameId, {
      currentRound: game.currentRound + 1,
    });

    return game.currentRound + 1;
  },
});

/**
 * Delete a game
 */
export const deleteGame = mutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    // Delete all rounds associated with the game
    const rounds = await ctx.db
      .query('rounds')
      .withIndex('by_game', (q) => q.eq('gameId', args.gameId))
      .collect();

    for (const round of rounds) {
      await ctx.db.delete(round._id);
    }

    // Delete the game
    await ctx.db.delete(args.gameId);
  },
});
