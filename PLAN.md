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

  // Trump card tracking (optional - may be null if entire deck dealt)
  trumpCard?: {
    suit: "hearts" | "diamonds" | "clubs" | "spades",
    rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K",
    displayText: string, // e.g., "A♠", "7♥"
    wasAutoAssigned: boolean, // true if auto-generated, false if dealer override
  } | null,  // null when no cards remain for trump (e.g., Round 13 with 4 players)

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
│   ├── RoundHeader.tsx       # Round number, dealer indicator
│   ├── TrumpCard.tsx         # Trump card display component
│   └── TrumpCardPicker.tsx   # Trump card selector (for dealer override)
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
├── validation.ts             # Game rule validations (including total calls ≠ round number)
├── trump.ts                  # Trump card generation and utilities
└── constants.ts              # Scoring table, card suits/ranks, etc.
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
- **Trump card display** with dealer override option
  - Auto-assigned trump shown (randomly generated)
  - "Change Trump" button for dealer to override
  - Visual card representation with suit symbol (♥♦♣♠)
- Player list with call entry
- Current player highlight (shows whose turn to call)
- Call validation message (see validation rules below)
- "Start Playing" button (after all calls entered)

**Trump Card Assignment:**
- **Physical game rule**: Trump is the top card of remaining deck AFTER dealing to all players
  - Trump card is NOT in any player's hand
  - Example: Round 3, 4 players = 12 cards dealt, trump is the 13th card from deck
- **Auto-assign**: App randomly generates trump as simulation (for speed)
  - Calculates if cards remain: 52 - (roundNumber × numberOfPlayers)
  - If cards remain: generate random trump
  - If no cards remain: no trump for this round
- **Dealer override (IMPORTANT)**: Dealer should tap "Change Trump" to match actual card from physical deck
  - Auto-generation doesn't know which cards are in players' hands
  - Dealer verifies physical trump and updates in app
- **Tracking**: Stores trump card, whether it was auto-assigned or manually set, and handles null case

**Key Logic:**
- Players call in clockwise order starting from player after dealer
- Dealer calls last
- **CRITICAL VALIDATION RULE**: Total calls cannot equal round number

**🚨 VALIDATION RULE: Total Calls ≠ Round Number**

This is the most important validation rule in Rung. The sum of all player calls MUST NOT equal the number of cards dealt (round number).

**Why?** This ensures that someone will always fail to make their exact call, preventing ties.

**How it works:**
- As each player makes their call, sum is calculated
- When it's the dealer's turn (last to call), check if their call would make total = round number
- If yes, show error and prevent that call
- Dealer must choose a different number

**Examples:**

**Example 1 - Round 1 (1 card each), 4 players:**
```
P1 calls: 1  → Total: 1
P2 calls: 0  → Total: 1
P3 calls: 0  → Total: 1
P4 (dealer) tries: 0 ❌
  → Total would be 1, which EQUALS round number (1)
  → INVALID! Dealer must call 1 instead
```

**Example 2 - Round 5 (5 cards each), 3 players:**
```
P1 calls: 2  → Total: 2
P2 calls: 3  → Total: 5
P3 (dealer) tries: 0 ❌
  → Total would be 5, which EQUALS round number (5)
  → INVALID! Dealer must call any number except 0

P3 (dealer) calls: 1 ✅
  → Total is 6, which does NOT equal 5
  → VALID!
```

**Example 3 - Round 7 (7 cards each), 4 players:**
```
P1 calls: 2  → Total: 2
P2 calls: 1  → Total: 3
P3 calls: 3  → Total: 6
P4 (dealer) tries: 1 ❌
  → Total would be 7, which EQUALS round number (7)
  → INVALID! Dealer can call 0, 2, 3, 4, 5, 6, or 7 (anything except 1)
```

**UI Implementation:**
- Show running total as players enter calls
- When dealer's turn, highlight invalid options
- Display error message: "Total calls cannot equal {roundNumber}. Please choose a different call."
- Visually disable/highlight the forbidden call option

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
- [ ] Define Convex schema (games, rounds tables with trump card)
- [ ] Create game mutations (create, update, delete)
- [ ] Create round mutations (create, update calls, update results, update trump)
- [ ] Implement scoring calculation functions
- [ ] Create validation utilities
  - [ ] Validate total calls ≠ round number
  - [ ] Calculate forbidden call for dealer
  - [ ] Validate call ranges (0 to roundNumber)
- [ ] Implement trump card utilities
  - [ ] Cards remaining calculator (52 - roundNumber × players)
  - [ ] Random trump generation function (returns null if no cards remain)
  - [ ] Trump card formatting (display text with symbols)
  - [ ] Handle "no trump" scenario for high rounds with many players
- [ ] Set up MMKV storage layer and hooks
- [ ] Implement offline mutation queue
- [ ] Create sync utilities (MMKV ↔ Convex)
- [ ] Write unit tests for scoring logic
- [ ] Write unit tests for validation logic (especially total calls ≠ round number)
- [ ] Set up Convex dev environment

### Phase 3: Core UI Components 🎨
- [ ] Create base Tamagui components (Button, Card, Input)
- [ ] Build PlayerCard component
- [ ] Build ScoreTable component (scrollable)
- [ ] Build TrumpCard display component (with suit symbols)
  - [ ] Show visual card representation when trump exists
  - [ ] Show "No Trump - Entire Deck Dealt" message when null
  - [ ] Add helper text explaining trump is from remaining deck
- [ ] Build TrumpCardPicker modal (suit + rank selectors)
- [ ] Build CallingMode component with validation
  - [ ] Add running total display
  - [ ] Implement dealer call validation (total ≠ round number)
  - [ ] Visual feedback for invalid calls
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
- [ ] Implement auto-trump generation when round starts
- [ ] Display trump card with visual card representation
- [ ] Add "Change Trump" button and modal picker
- [ ] Implement turn-based call entry
- [ ] Show running total of calls as players enter them
- [ ] Add dealer validation logic (total calls ≠ round number)
  - [ ] Calculate and highlight forbidden call option
  - [ ] Show clear error message when dealer tries invalid call
- [ ] Visual feedback for current player
- [ ] Error messages for invalid calls
- [ ] Connect to Convex mutations with offline queue
- [ ] Test validation edge cases thoroughly
  - [ ] Test all round numbers (1-13)
  - [ ] Test different player counts (2-8)
  - [ ] Test edge case where dealer has multiple invalid options

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
- ✅ Calls must be 0 to roundNumber (e.g., in round 5, calls can be 0-5)
- ✅ **CRITICAL**: Total calls cannot equal roundNumber (enforced on dealer)
  - Sum of all player calls ≠ round number
  - Example: Round 5 with 3 players - if P1=2, P2=3, then P3 cannot call 0 (total would be 5)
- ✅ Dealer validation enforced last (dealer calls after all other players)
- ✅ Cannot proceed until all calls entered
- ✅ Show running total of calls as players enter them
- ✅ Visually indicate forbidden call option for dealer
- ✅ Trump card handling:
  - Auto-generate based on cards remaining (52 - roundNumber × players)
  - Show "No Trump" message if entire deck is dealt
  - Allow dealer to override to match physical trump card
  - Validate that trump is from remaining deck, not players' hands

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

### Trump Card Implementation

**How Trump Works in Physical Game:**
- Dealer shuffles and deals cards to all players (Round N = N cards per player)
- After dealing, dealer flips the **top card of the remaining deck** face-up
- This card becomes the trump suit for that round
- **Key rule**: Trump card is NOT in any player's hand (it's from undealt cards)
- **Example**: Round 3 with 4 players = 12 cards dealt, trump is the 13th card

**Cards Remaining Calculator:**
```typescript
function getCardsRemaining(roundNumber: number, numberOfPlayers: number) {
  const totalCards = 52;
  const cardsDealt = roundNumber * numberOfPlayers;
  return totalCards - cardsDealt;
}

// Examples:
// Round 1, 4 players: 52 - 4 = 48 cards remain
// Round 5, 3 players: 52 - 15 = 37 cards remain
// Round 10, 4 players: 52 - 40 = 12 cards remain
// Round 13, 4 players: 52 - 52 = 0 cards remain (NO TRUMP!)
```

**Auto-Generation Algorithm:**
```typescript
function generateRandomTrump(roundNumber: number, numberOfPlayers: number) {
  const cardsRemaining = 52 - (roundNumber * numberOfPlayers);

  // Check if there are cards left for trump
  if (cardsRemaining < 1) {
    return null; // No trump this round
  }

  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const suit = suits[Math.floor(Math.random() * suits.length)];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];

  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };

  return {
    suit,
    rank,
    displayText: `${rank}${suitSymbols[suit]}`,
    wasAutoAssigned: true,
  };
}
```

**Note on Auto-Generation:**
- The app generates a random trump card as a **simulation** to speed up gameplay
- This is NOT perfectly accurate (might theoretically pick a card in someone's hand)
- **The app doesn't know what cards players actually have in the physical game**
- This is why dealer override is important!

**Dealer Override Flow:**
1. Round starts → Auto-generate trump → Display to user
2. Dealer looks at actual trump from physical deck
3. If different, dealer taps "Change Trump" button
4. Modal opens with card picker (suit + rank selectors)
5. Dealer selects the ACTUAL trump card from physical game
6. Save with `wasAutoAssigned: false`
7. Display updated trump card

**Why Both Auto and Manual?**
- **Auto-generation**: Speeds up digital-only games or practice games
- **Dealer override (RECOMMENDED)**: Ensures accuracy for serious games with physical cards
- **Best practice**: Dealer should always verify and update trump to match physical deck
- **Edge cases**: Some rounds may have no trump (when entire deck is dealt)

### Game Rules Summary
1. Deal increases each round (1 card → 13 cards)
2. **Trump determined by top card of remaining deck AFTER dealing**
   - In physical game: Dealer deals cards to all players, then flips top card of remaining deck as trump
   - **IMPORTANT**: Trump card cannot be in any player's hand (it's from the undealt cards)
   - **In app**: Auto-generates random trump as simulation
   - **Dealer override**: Dealer should change trump to match actual card from physical deck
   - **Edge case**: In high rounds with many players, entire deck may be dealt (no trump card)
3. Players call starting clockwise from dealer
4. **🚨 CRITICAL VALIDATION**: Total calls ≠ round number (enforced on dealer)
   - Sum of all calls must NOT equal the number of cards dealt
   - Prevents situations where everyone makes their call
5. Points awarded only if actual hands = called hands
6. Game ends after 13 rounds
7. Scorer tracks calls, results, and trump card

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
- ✅ Trump card auto-generates and displays correctly
- ✅ Dealer can override trump card to match physical game
- ✅ All validation rules enforced correctly
  - ✅ **CRITICAL**: Total calls ≠ round number validation works for all scenarios
  - ✅ Dealer cannot make forbidden call
  - ✅ Clear error messages guide user
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
**Decision**: Auto-assign with dealer override (simulation + accuracy)
- **How trump works in real game**:
  - After dealing cards to players, dealer flips top card of remaining deck as trump
  - Trump card is NEVER in any player's hand (it's from undealt cards)
  - In some rounds, entire deck is dealt → no trump card exists
- **App behavior**:
  - Auto-generates random trump when round starts (simulation for speed)
  - Checks if cards remain after dealing (52 - roundNumber × players)
  - Returns null if no cards remain for trump
- **Dealer override (RECOMMENDED)**:
  - Dealer should verify and update to match ACTUAL trump from physical deck
  - This ensures accuracy since app doesn't know which cards players hold
- **Tracking**: Stores trump card, whether auto-assigned, and handles null case
- **Display**: Visual card representation with suit symbols (♥♦♣♠) or "No Trump" message

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
