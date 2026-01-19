# Rung Score Keeper - Implementation Plan

## 🎯 Project Overview

A cross-platform (web, iOS, Android) score keeping application for the card game Rung, built with modern React Native technologies.

## 🛠 Tech Stack

- **Framework**: React Native with Expo (SDK 52+)
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript (strict mode)
- **UI Library**: Tamagui (cross-platform UI components)
- **Backend**: Convex (real-time database and backend)
- **State Management**: React hooks + Convex queries/mutations
- **Development**: Expo Go for testing, EAS for builds

---

## 📊 Data Models

### Convex Schema

#### `games` table
```typescript
{
  _id: Id<"games">,
  _creationTime: number,
  status: "setup" | "in_progress" | "completed",
  createdAt: number,
  completedAt?: number,

  // Game configuration
  numberOfPlayers: number, // 2-8
  dealerIndex: number, // which player is dealer
  currentRound: number, // 1-13

  // Player data
  players: Array<{
    id: string,
    name: string,
    position: number, // 0-7
  }>,
}
```

#### `rounds` table
```typescript
{
  _id: Id<"rounds">,
  _creationTime: number,
  gameId: Id<"games">,
  roundNumber: number, // 1-13 (number of cards dealt)
  trumpCard?: string, // e.g., "A♠", "7♥"

  // Player calls and results
  playerRounds: Array<{
    playerId: string,
    playerName: string,
    call: number, // how many hands they called
    handsWon: number, // actual hands won
    points: number, // calculated based on call vs handsWon
    isDealer: boolean,
  }>,

  status: "calling" | "playing" | "completed",
  currentPlayerIndex?: number, // for tracking whose turn to call
}
```

#### `gameHistory` table (optional - for future features)
```typescript
{
  _id: Id<"gameHistory">,
  gameId: Id<"games">,
  timestamp: number,
  action: string, // "game_created", "round_started", "call_made", etc.
  metadata: object,
}
```

---

## 🗺 App Architecture & Routes

### File Structure
```
app/
├── (tabs)/                    # Tab-based navigation (if needed)
├── _layout.tsx               # Root layout
├── index.tsx                 # Home/landing screen
├── new-game.tsx              # Game setup
├── game/
│   ├── [id].tsx              # Active game screen (dynamic route)
│   ├── round-calling.tsx     # Call entry screen
│   └── round-results.tsx     # Result entry screen
├── history.tsx               # Past games list
└── settings.tsx              # App settings

components/
├── ui/                       # Tamagui styled components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── PlayerCard.tsx
├── game/
│   ├── PlayerList.tsx
│   ├── ScoreTable.tsx
│   ├── CallEntry.tsx
│   ├── RoundSummary.tsx
│   └── TrumpDisplay.tsx
└── setup/
    ├── PlayerSetup.tsx
    └── DealerSelector.tsx

convex/
├── schema.ts                 # Convex schema definitions
├── games.ts                  # Game CRUD operations
├── rounds.ts                 # Round operations
└── scoring.ts                # Scoring logic (pure functions)

utils/
├── scoring.ts                # Scoring calculations
├── validation.ts             # Game rule validations
└── constants.ts              # Scoring table, etc.
```

---

## 🎮 Core Features & User Flows

### 1. Game Setup Flow (`/new-game`)

**UI Components:**
- Number of players selector (2-8)
- Player name inputs (dynamic based on count)
- Dealer selection (radio buttons or picker)
- "Start Game" button

**Validation:**
- All player names must be unique
- All fields required before proceeding
- Minimum 2, maximum 8 players

**Convex Mutation:**
```typescript
createGame({
  numberOfPlayers: number,
  players: Array<{ name: string }>,
  dealerIndex: number,
})
```

**Flow:**
1. User selects number of players
2. Form expands to show name inputs
3. User enters names
4. User selects dealer
5. Submit creates game in Convex
6. Navigate to `/game/[id]` (Round 1, calling phase)

---

### 2. Round Calling Phase (`/game/[id]` - calling mode)

**UI Components:**
- Round indicator (e.g., "Round 3 - 3 cards each")
- Trump card display (optional: randomly show a suit/rank)
- Player list with call entry
- Current player highlight
- Call validation message
- "Start Playing" button (after all calls entered)

**Key Logic:**
- Players call in clockwise order starting from player after dealer
- Dealer calls last
- **Validation Rule**: Total calls ≠ round number
  - If dealer's turn and calls would equal round number, show error
  - Force dealer to choose different call

**Example Validation:**
```
Round 1 (1 card each), 4 players:
P1 calls: 1
P2 calls: 0
P3 calls: 0
P4 (dealer) tries to call: 0 ❌
  → Total would be 1, which equals round number
  → Must call 1 instead
```

**Convex Mutation:**
```typescript
setPlayerCall({
  roundId: Id<"rounds">,
  playerId: string,
  call: number,
})
```

---

### 3. Round Playing Phase (`/game/[id]` - playing mode)

**UI Components:**
- Score table showing all players
- Each row: Player name, Call, Hands won, Points this round
- Increment/decrement buttons for hands won
- Running total column
- "Complete Round" button

**Key Logic:**
- Track hands won for each player (0 to roundNumber)
- Calculate points automatically:
  - If handsWon === call: points from scoring table
  - If handsWon ≠ call: 0 points
- Update running totals

**Scoring Table Reference:**
```typescript
const SCORING_TABLE = {
  0: 5,
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 30,
  6: 35,
  7: 40,
  8: 45,
  9: 50,
  10: 55,
  11: 60,
  12: 65,
};
```

**Convex Mutation:**
```typescript
updateHandsWon({
  roundId: Id<"rounds">,
  playerId: string,
  handsWon: number,
})

completeRound({
  roundId: Id<"rounds">,
})
```

---

### 4. Main Game Screen (`/game/[id]`)

**Displays:**
- Current round number
- Mode: "Calling" or "Playing" or "Round Complete"
- Scorecard table:
  - Columns: Player, Calls (R1, R2, ...), Points (R1, R2, ...), Total
  - Scrollable horizontally for many rounds
- Action buttons based on state:
  - "Start Round X" → enters calling phase
  - "Enter Results" → enters playing phase
  - "Next Round" → advances to next round
  - "End Game" → marks game complete

**State Management:**
- Subscribe to Convex game and rounds data
- Real-time updates if multiple scorers (future feature)
- Local state for UI interactions

---

### 5. Game Completion

**Trigger:** After Round 13 (13 cards dealt)

**Display:**
- Final scores
- Winner announcement (highest total)
- Option to:
  - Start new game with same players
  - Return to home
  - View game history

---

## 🎨 UI/UX Considerations

### Tamagui Theming
- Light/dark mode support
- Primary color: card game theme (e.g., green felt)
- Accent colors for suits (red for ♥♦, black for ♠♣)

### Responsive Design
- Mobile-first (portrait)
- Tablet landscape support for scorecard
- Web desktop support

### Key Interactions
- **Swipe gestures**: Navigate between rounds (mobile)
- **Long press**: Edit previous round (with confirmation)
- **Pull to refresh**: Update game state
- **Auto-save**: All inputs saved immediately to Convex

### Accessibility
- High contrast mode
- Large touch targets (minimum 44x44px)
- Screen reader support
- Clear error messages

---

## ⚙️ Implementation Phases

### Phase 1: Project Setup ✅
- [ ] Initialize Expo project with Router
- [ ] Configure TypeScript (strict mode)
- [ ] Install and configure Tamagui
- [ ] Set up Convex backend
- [ ] Configure environment variables
- [ ] Set up basic navigation structure
- [ ] Create theme configuration
- [ ] Set up .gitignore and basic README

### Phase 2: Data Layer 📊
- [ ] Define Convex schema (games, rounds tables)
- [ ] Create game mutations (create, update, delete)
- [ ] Create round mutations (create, update calls, update results)
- [ ] Implement scoring calculation functions
- [ ] Create validation utilities
- [ ] Write unit tests for scoring logic
- [ ] Set up Convex dev environment

### Phase 3: Core UI Components 🎨
- [ ] Create base Tamagui components (Button, Card, Input)
- [ ] Build PlayerCard component
- [ ] Build ScoreTable component (scrollable)
- [ ] Build CallEntry component with validation
- [ ] Build RoundSummary component
- [ ] Create loading and error states
- [ ] Implement theme switching

### Phase 4: Game Setup Flow 🎮
- [ ] Build new game screen
- [ ] Player count selector
- [ ] Dynamic player name inputs
- [ ] Dealer selection UI
- [ ] Form validation
- [ ] Connect to Convex createGame mutation
- [ ] Navigation to game screen
- [ ] Add animations/transitions

### Phase 5: Calling Phase 📞
- [ ] Build calling UI
- [ ] Implement turn-based call entry
- [ ] Add dealer validation logic
- [ ] Visual feedback for current player
- [ ] Error messages for invalid calls
- [ ] Connect to Convex mutations
- [ ] Trump card display (random or manual entry)

### Phase 6: Playing Phase 🃏
- [ ] Build hands won tracking UI
- [ ] Implement increment/decrement controls
- [ ] Auto-calculate points
- [ ] Update running totals
- [ ] Round completion flow
- [ ] Connect to Convex mutations
- [ ] Add round history view

### Phase 7: Game Management 📋
- [ ] Build main game screen with scorecard
- [ ] Implement round navigation
- [ ] Add edit previous round feature
- [ ] Game completion detection
- [ ] Winner announcement
- [ ] New game flow
- [ ] Game history list screen

### Phase 8: Polish & Optimization ✨
- [ ] Add animations and transitions
- [ ] Optimize performance (memoization, lazy loading)
- [ ] Add offline support (Convex sync)
- [ ] Improve error handling
- [ ] Add loading skeletons
- [ ] Haptic feedback (mobile)
- [ ] Sound effects (optional)

### Phase 9: Testing & Deployment 🚀
- [ ] Write integration tests
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator
- [ ] Test web version
- [ ] Performance profiling
- [ ] Configure EAS Build
- [ ] Create app icons and splash screens
- [ ] Deploy web version
- [ ] Submit to app stores (optional)

---

## 🔧 Technical Decisions

### Why Convex?
- Real-time sync out of the box
- TypeScript-first API
- Built-in optimistic updates
- Serverless functions for game logic
- Easy offline support
- No need for separate API layer

### Why Tamagui?
- Optimal performance for React Native
- Consistent styling across platforms
- Built-in theming system
- Smaller bundle size than alternatives
- Great TypeScript support
- Active development

### Why Expo Router?
- File-based routing (familiar to Next.js users)
- Deep linking support
- Type-safe navigation
- Shared routes across platforms
- Better than React Navigation for new projects

### State Management Strategy
- **Server state**: Convex queries (automatic caching)
- **UI state**: React useState/useReducer
- **Navigation state**: Expo Router
- **No Redux/MobX needed** - Convex handles most state

---

## 🚨 Edge Cases & Validations

### Setup Phase
- ✅ Duplicate player names not allowed
- ✅ Empty player names not allowed
- ✅ Must select valid dealer (0 to players-1)

### Calling Phase
- ✅ Calls must be 0 to roundNumber
- ✅ Total calls cannot equal roundNumber
- ✅ Dealer validation enforced last
- ✅ Cannot proceed until all calls entered

### Playing Phase
- ✅ Hands won cannot exceed roundNumber
- ✅ Hands won cannot be negative
- ✅ Sum of all hands won should equal roundNumber (warning, not enforced)

### Round Navigation
- ✅ Cannot go to round N+2 without completing N+1
- ✅ Can edit previous rounds (with confirmation)
- ✅ Editing previous round recalculates all subsequent totals

### Game Completion
- ✅ Game ends after round 13
- ✅ Cannot add more rounds after completion
- ✅ Can still view/edit completed games

---

## 📱 Platform-Specific Considerations

### iOS
- Follow iOS Human Interface Guidelines
- Use native navigation bar
- Haptic feedback on actions
- Consider iOS share sheet for results

### Android
- Material Design 3 patterns
- Android back button behavior
- Share functionality via Android share menu

### Web
- Keyboard navigation support
- Responsive breakpoints (mobile, tablet, desktop)
- PWA capabilities (install prompt, offline support)
- Print stylesheet for scorecard

---

## 🔮 Future Enhancements (Post-MVP)

### Multiplayer Features
- Multiple scorers can join same game (Convex real-time)
- Live game updates across devices
- Share game link

### Analytics & Stats
- Player lifetime statistics
- Win rate tracking
- Average scores
- Leaderboards

### Advanced Features
- Undo/redo functionality
- Game templates (save player groups)
- Custom scoring rules
- Timer per round (optional)
- Voice input for calls
- Card graphics instead of text
- Animation for trump reveal
- Tutorial/onboarding for new users

### Social Features
- Share final scores to social media
- Export scorecard as image/PDF
- Friend system
- Tournaments

---

## 📚 Resources & References

### Documentation
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [Tamagui Docs](https://tamagui.dev/docs/intro/introduction)
- [Convex Docs](https://docs.convex.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

### Scoring Reference
The scoring table is based on the rule: `points = call * 5 + 5`
- Call 0 → 5 points
- Call 1 → 10 points
- Call 2 → 15 points
- ...and so on

### Game Rules Summary
1. Deal increases each round (1 card → 13 cards)
2. Trump determined by next card after dealing
3. Players call starting clockwise from dealer
4. Total calls ≠ cards in hand (enforced on dealer)
5. Points awarded only if actual hands = called hands
6. Game ends after 13 rounds

---

## ✅ Success Criteria

### MVP Complete When:
- ✅ Can create new game with 2-8 players
- ✅ Can complete full game (rounds 1-13)
- ✅ All validation rules enforced correctly
- ✅ Scoring calculated accurately
- ✅ Scorecard displays correctly on all platforms
- ✅ Data persists in Convex
- ✅ App works on iOS, Android, and Web
- ✅ No major bugs or crashes
- ✅ Responsive UI on different screen sizes

---

## 🤔 Open Questions for Discussion

1. **Trump Card Display**: Should trump be:
   - Manually entered by scorer?
   - Randomly generated (simulated)?
   - Not tracked at all (just for players' reference)?

2. **Round Flow**: Should we have separate screens for:
   - Calling phase vs playing phase?
   - Or keep everything on one screen with conditional rendering?

3. **Edit History**: Should users be able to:
   - Edit any previous round freely?
   - Only edit the most recent round?
   - Require confirmation before editing?

4. **Offline Support**:
   - How important is offline functionality?
   - Should games auto-save locally and sync later?

5. **Onboarding**:
   - Include in-app tutorial?
   - Just link to rules?
   - Assume users know how to play?

6. **Multiple Games**:
   - Can user have multiple active games?
   - Archive/delete old games?
   - How to handle game list UI?

7. **Theme/Branding**:
   - Specific color scheme preference?
   - Logo/icon ideas?
   - Any cultural design elements for Rung?

---

## 🎬 Next Steps

After plan approval:
1. Initialize Expo project with TypeScript and Router
2. Set up Tamagui theme configuration
3. Initialize Convex backend with schema
4. Create basic navigation structure
5. Build and test one complete flow (e.g., game setup)
6. Iterate based on feedback

---

**Last Updated**: 2026-01-19
**Status**: 📋 Planning Phase
**Ready for Review**: ✅ Yes
