# Rung Score Keeper - Implementation Plan

## 🎯 Project Overview

A cross-platform (web, iOS, Android) score keeping application for the card game Rung, built with modern React Native technologies.

## 🛠 Tech Stack

- **Framework**: React Native with Expo (SDK 52+)
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript (strict mode)
- **UI Library**: Tamagui (cross-platform UI components)
- **Backend**: Convex (real-time database and backend)
- **Local Storage**: React Native MMKV (fast, synchronous key-value storage)
- **State Management**: React hooks + Convex queries/mutations
- **Development**: Expo Go for testing, EAS for builds
- **Offline Support**: MMKV for local persistence + Convex sync

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
├── _layout.tsx               # Root layout with theme provider
├── index.tsx                 # Home/landing screen
├── new-game.tsx              # Game setup screen
├── game/
│   └── [id].tsx              # Active game screen (single screen, mode switching)
├── history.tsx               # Past games list (nice-to-have)
└── settings.tsx              # App settings (theme toggle, etc.)

components/
├── ui/                       # Tamagui styled components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── PlayerCard.tsx
├── game/
│   ├── GameModeSwitch.tsx    # Switches between calling/playing/scorecard modes
│   ├── CallingMode.tsx       # Call entry UI with validation
│   ├── PlayingMode.tsx       # Hands won tracking UI
│   ├── ScorecardMode.tsx     # Full game scorecard view
│   ├── ScoreTable.tsx        # Reusable score table component
│   └── RoundHeader.tsx       # Round number, dealer indicator
└── setup/
    ├── PlayerSetup.tsx       # Player count + name inputs
    └── DealerSelector.tsx    # Dealer selection UI

convex/
├── schema.ts                 # Convex schema definitions
├── games.ts                  # Game CRUD operations
├── rounds.ts                 # Round operations
└── scoring.ts                # Scoring logic (pure functions)

lib/
├── mmkv.ts                   # MMKV storage instance
├── offline-sync.ts           # Offline queue management
└── hooks/
    ├── useMMKV.ts            # MMKV storage hooks
    └── useOfflineSync.ts     # Sync hook for Convex

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
- Player list with call entry
- Current player highlight (shows whose turn to call)
- Call validation message
- "Start Playing" button (after all calls entered)

**Note:** Trump card is handled during physical gameplay and not tracked in app

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

### 4. Main Game Screen (`/game/[id]`) - Single Screen with Mode Switching

**Three Modes in One Screen:**

**Mode 1: Calling**
- Show player list with call inputs
- Highlight current player whose turn to call
- Show validation errors (total calls ≠ round number)
- "Start Playing" button when all calls entered

**Mode 2: Playing**
- Show each player with their call and hands won
- Increment/decrement buttons for hands won
- Auto-calculate and display points
- "Complete Round" button when all hands tracked

**Mode 3: Scorecard View**
- Full scorecard table:
  - Columns: Player, Calls (R1, R2, ...), Points (R1, R2, ...), Total
  - Scrollable horizontally for many rounds
- "Start Round X" button to begin next round
- "Edit Round X" buttons with confirmation dialog
- "End Game" after round 13

**State Management:**
- Subscribe to Convex game and rounds data
- MMKV for local offline storage
- Optimistic updates with offline queue
- Real-time sync when online

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
- [ ] Install and configure React Native MMKV
- [ ] Configure environment variables
- [ ] Set up basic navigation structure
- [ ] Create theme configuration (light + dark mode)
- [ ] Set up .gitignore and basic README
- [ ] Configure offline sync architecture

### Phase 2: Data Layer 📊
- [ ] Define Convex schema (games, rounds tables)
- [ ] Create game mutations (create, update, delete)
- [ ] Create round mutations (create, update calls, update results)
- [ ] Implement scoring calculation functions
- [ ] Create validation utilities
- [ ] Set up MMKV storage layer and hooks
- [ ] Implement offline mutation queue
- [ ] Create sync utilities (MMKV ↔ Convex)
- [ ] Write unit tests for scoring logic
- [ ] Set up Convex dev environment

### Phase 3: Core UI Components 🎨
- [ ] Create base Tamagui components (Button, Card, Input)
- [ ] Build PlayerCard component
- [ ] Build ScoreTable component (scrollable)
- [ ] Build CallingMode component with validation
- [ ] Build PlayingMode component
- [ ] Build ScorecardMode component
- [ ] Create loading and error states
- [ ] Implement dark/light mode toggle
- [ ] Add mode switching animations

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
- [ ] Implement turn-based call entry
- [ ] Add dealer validation logic (total calls ≠ round number)
- [ ] Visual feedback for current player
- [ ] Error messages for invalid calls
- [ ] Connect to Convex mutations with offline queue
- [ ] Test validation edge cases

### Phase 6: Playing Phase 🃏
- [ ] Build hands won tracking UI
- [ ] Implement increment/decrement controls
- [ ] Auto-calculate points
- [ ] Update running totals
- [ ] Round completion flow
- [ ] Connect to Convex mutations
- [ ] Add round history view

### Phase 7: Game Management 📋
- [ ] Implement mode switching (calling → playing → scorecard)
- [ ] Add edit previous round feature (with confirmation)
- [ ] Build round navigation UI
- [ ] Game completion detection (after round 13)
- [ ] Winner announcement screen
- [ ] New game flow (replace current game)
- [ ] Game history list screen (nice-to-have)

### Phase 8: Polish & Optimization ✨
- [ ] Add animations and transitions
- [ ] Optimize performance (memoization, lazy loading)
- [ ] Test offline support (airplane mode scenarios)
- [ ] Implement conflict resolution for sync
- [ ] Add offline indicator in UI
- [ ] Improve error handling and retry logic
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
- **Local persistence**: React Native MMKV (fast, synchronous)
- **Offline queue**: MMKV-stored mutations synced when online
- **UI state**: React useState/useReducer
- **Navigation state**: Expo Router
- **No Redux/MobX needed** - Convex + MMKV handle most state

### Why MMKV?
- **Ultra fast**: Up to 30x faster than AsyncStorage
- **Synchronous API**: No async/await needed for simple reads/writes
- **Small footprint**: ~30KB bundle size
- **Cross-platform**: Works on iOS, Android, and Web (with polyfill)
- **Type-safe**: Great TypeScript support
- **Reliable**: Used by production apps with millions of users
- **Perfect for offline-first**: Instant reads/writes for game state

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
2. Trump determined by next card after dealing (not tracked in app)
3. Players call starting clockwise from dealer
4. **Critical validation**: Total calls ≠ cards in hand (enforced on dealer)
5. Points awarded only if actual hands = called hands
6. Game ends after 13 rounds
7. Scorer tracks calls and results only (trump handled during physical gameplay)

---

## 🔄 Offline-First Architecture

### How It Works

**Write Flow (User makes changes):**
1. User action (e.g., sets player call) → Update MMKV immediately
2. Queue mutation in MMKV offline queue
3. If online: Send to Convex, remove from queue on success
4. If offline: Keep in queue, show "offline" indicator
5. When connection restored: Process queue in order

**Read Flow (Display data):**
1. Primary source: MMKV (instant, synchronous)
2. Subscribe to Convex for real-time updates
3. When Convex data arrives: Update MMKV, re-render UI
4. Conflict resolution: Last-write-wins (or custom logic)

**Benefits:**
- ⚡ Instant UI updates (no loading states)
- 🔌 Works completely offline
- 🔄 Auto-sync when online
- 💾 Data never lost (persisted locally)
- 🎮 Perfect for games (low latency critical)

**MMKV Storage Keys:**
```typescript
// Current active game
mmkv.set('current_game', JSON.stringify(game))

// Offline mutation queue
mmkv.set('offline_queue', JSON.stringify([
  { type: 'createGame', data: {...} },
  { type: 'setPlayerCall', data: {...} },
]))

// User preferences
mmkv.set('theme', 'dark')
mmkv.set('onboarding_completed', true)
```

---

## ✅ Success Criteria

### MVP Complete When:
- ✅ Can create new game with 2-8 players
- ✅ Can complete full game (rounds 1-13)
- ✅ All validation rules enforced correctly
- ✅ Scoring calculated accurately
- ✅ Scorecard displays correctly on all platforms
- ✅ Data persists locally (MMKV) and syncs to Convex
- ✅ Works completely offline with sync when online
- ✅ Dark mode toggle works across all screens
- ✅ App works on iOS, Android, and Web
- ✅ No major bugs or crashes
- ✅ Responsive UI on different screen sizes

---

## ✅ Design Decisions

### 1. Trump Card
**Decision**: Not tracked in app
- Players handle trump during physical gameplay
- Keeps app focused on score keeping
- Reduces data entry burden on scorer

### 2. UI Flow
**Decision**: Single screen with mode switching
- More compact and efficient
- Reduces navigation complexity
- Three modes: Calling → Playing → Scorecard
- Smooth transitions between modes

### 3. Edit History
**Decision**: Edit any round with confirmation dialog
- Maximum flexibility to fix mistakes
- Confirmation prevents accidental edits
- Recalculates totals automatically
- Shows warning when editing past rounds

### 4. MVP Features
**Included in MVP:**
- ✅ Dark mode support (toggle in settings)
- ✅ Single active game at a time
- ✅ Full game flow (setup → 13 rounds → completion)

**Nice-to-have (Post-MVP):**
- 📋 Game history/archive
- 📤 Export scorecard as PDF/image
- 👥 Multiple simultaneous games

### 5. Offline Support
**Decision**: Full offline-first architecture
- React Native MMKV for local storage
- Offline mutation queue
- Auto-sync when connection restored
- Works completely offline during gameplay
- Critical for locations with poor connectivity

### 6. Onboarding
**Decision**: Minimal onboarding (to be determined)
- Assume users know how to play Rung
- Brief tooltip tour on first launch
- Help/rules accessible from settings
- Focus on intuitive UI over tutorials

---

## 🎬 Next Steps

Ready to begin implementation! Here's the kickoff sequence:

### Immediate (Phase 1):
1. Initialize Expo project with Router and TypeScript
2. Install dependencies: Tamagui, Convex, MMKV
3. Set up project structure (app/, components/, convex/, lib/)
4. Configure Tamagui with dark/light themes
5. Set up Convex backend and MMKV storage
6. Create basic navigation shell

### First Feature (Phase 2-4):
7. Build game setup flow (test offline-first pattern)
8. Create Convex schema and mutations
9. Test MMKV → Convex sync pipeline
10. Deploy to Expo Go for testing

### Iteration:
- Build calling phase
- Build playing phase
- Add scorecard view
- Polish and test on all platforms

---

**Last Updated**: 2026-01-19
**Status**: ✅ Plan Approved - Ready for Implementation
**Tech Stack**: Expo Router + Tamagui + Convex + MMKV
**Key Decisions**: Single-screen UI, offline-first, dark mode, no trump tracking
