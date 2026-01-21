import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Convex schema for Rung Score Keeper
 * Defines the structure of games and rounds tables
 */
export default defineSchema({
  games: defineTable({
    status: v.union(
      v.literal('lobby'),
      v.literal('setup'),
      v.literal('in_progress'),
      v.literal('completed')
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),

    // Game configuration
    numberOfPlayers: v.number(),
    dealerIndex: v.number(),
    currentRound: v.number(),

    // Join code for QR sync (4 char uppercase)
    joinCode: v.string(),

    // Player data
    players: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        position: v.number(),
        emoji: v.optional(v.string()),
      })
    ),

    // Track which players have joined via QR
    playerSessions: v.optional(v.array(
      v.object({
        playerId: v.string(),
        joinedAt: v.number(),
        deviceId: v.optional(v.string()),
      })
    )),
  })
    .index('by_status', ['status'])
    .index('by_join_code', ['joinCode']),

  rounds: defineTable({
    gameId: v.id('games'),
    roundNumber: v.number(),

    // Trump card tracking (optional - may be null if entire deck dealt)
    trumpCard: v.optional(
      v.union(
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
      )
    ),

    // Player calls and results
    playerRounds: v.array(
      v.object({
        playerId: v.string(),
        playerName: v.string(),
        playerEmoji: v.optional(v.string()),
        call: v.number(),
        handsWon: v.number(),
        points: v.number(),
        isDealer: v.boolean(),
        callSubmittedBy: v.optional(v.union(v.literal('scorekeeper'), v.literal('player'))),
      })
    ),

    status: v.union(
      v.literal('calling'),
      v.literal('playing'),
      v.literal('completed')
    ),
    currentPlayerIndex: v.optional(v.number()),
  })
    .index('by_game', ['gameId'])
    .index('by_game_and_round', ['gameId', 'roundNumber']),

  // Optional: Game history for tracking actions
  gameHistory: defineTable({
    gameId: v.id('games'),
    timestamp: v.number(),
    action: v.string(),
    metadata: v.any(),
  }).index('by_game', ['gameId']),
});
