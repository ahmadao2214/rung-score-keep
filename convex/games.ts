import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Generate a random 4-character uppercase join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new game with join code for QR sync
 */
export const createGame = mutation({
  args: {
    numberOfPlayers: v.number(),
    players: v.array(v.object({ 
      name: v.string(),
      emoji: v.optional(v.string()),
    })),
    dealerIndex: v.number(),
  },
  handler: async (ctx, args) => {
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
      emoji: player.emoji || '👤',
    }));

    // Generate unique join code
    let joinCode = generateJoinCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query('games')
        .withIndex('by_join_code', (q) => q.eq('joinCode', joinCode))
        .first();
      if (!existing || existing.status === 'completed') {
        break;
      }
      joinCode = generateJoinCode();
      attempts++;
    }

    const gameId = await ctx.db.insert('games', {
      status: 'in_progress',
      createdAt: Date.now(),
      numberOfPlayers: args.numberOfPlayers,
      dealerIndex: args.dealerIndex,
      currentRound: 1,
      players,
      joinCode,
      playerSessions: [],
    });

    return { gameId, joinCode };
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
 * Get a game by join code
 */
export const getGameByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_join_code', (q) => q.eq('joinCode', args.joinCode.toUpperCase()))
      .first();
    return game;
  },
});

/**
 * Player joins game via QR code
 */
export const joinGame = mutation({
  args: {
    joinCode: v.string(),
    playerId: v.string(),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_join_code', (q) => q.eq('joinCode', args.joinCode.toUpperCase()))
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'in_progress') {
      throw new Error('Game is not active');
    }

    // Check if player exists in game
    const player = game.players.find((p) => p.id === args.playerId);
    if (!player) {
      throw new Error('Player not found in game');
    }

    // Check if already joined
    const sessions = game.playerSessions || [];
    const existingSession = sessions.find((s) => s.playerId === args.playerId);
    if (existingSession) {
      return { success: true, alreadyJoined: true };
    }

    // Add player session
    await ctx.db.patch(game._id, {
      playerSessions: [
        ...sessions,
        {
          playerId: args.playerId,
          joinedAt: Date.now(),
          deviceId: args.deviceId,
        },
      ],
    });

    return { success: true, alreadyJoined: false };
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
