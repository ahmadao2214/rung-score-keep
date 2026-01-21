// Stub file for Convex API - generated when running `npx convex dev`
// This stub allows the app to build without Convex configured

// Create stub functions that have the Symbol that Convex expects
// This prevents crashes when trying to use these before Convex is fully deployed
const createStubFunction = (name: string) => {
  const stub = () => {
    throw new Error(`Convex function ${name} called but Convex is not fully deployed. Run 'npx convex dev' locally.`);
  };
  // Add the function name symbol that Convex React client expects
  (stub as any)[Symbol.for('functionName')] = name;
  return stub;
};

export const api = {
  games: {
    createLobby: createStubFunction('games:createLobby'),
    joinLobby: createStubFunction('games:joinLobby'),
    startGameFromLobby: createStubFunction('games:startGameFromLobby'),
    getGameByJoinCode: createStubFunction('games:getGameByJoinCode'),
    joinGame: createStubFunction('games:joinGame'),
    createGame: createStubFunction('games:createGame'),
    getGame: createStubFunction('games:getGame'),
    getActiveGames: createStubFunction('games:getActiveGames'),
    updateGameStatus: createStubFunction('games:updateGameStatus'),
    advanceRound: createStubFunction('games:advanceRound'),
    deleteGame: createStubFunction('games:deleteGame'),
  },
  rounds: {
    getCurrentRoundForPlayer: createStubFunction('rounds:getCurrentRoundForPlayer'),
    submitPlayerCall: createStubFunction('rounds:submitPlayerCall'),
    createRound: createStubFunction('rounds:createRound'),
    getRoundsByGame: createStubFunction('rounds:getRoundsByGame'),
    getRound: createStubFunction('rounds:getRound'),
    getRoundByNumber: createStubFunction('rounds:getRoundByNumber'),
    setPlayerCall: createStubFunction('rounds:setPlayerCall'),
    updateHandsWon: createStubFunction('rounds:updateHandsWon'),
    completeRound: createStubFunction('rounds:completeRound'),
    updateTrumpCard: createStubFunction('rounds:updateTrumpCard'),
  },
};
