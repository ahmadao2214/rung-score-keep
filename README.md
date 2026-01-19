# Rung Score Keeper

A cross-platform mobile app for tracking scores in the Rung card game, built with React Native, Expo, and modern development practices.

## Features

- **Game Setup**: Create games with 2-8 players
- **Trump Card Tracking**: Auto-generated trump with dealer override
- **Calling Phase**: Turn-based call entry with validation
- **Critical Validation**: Enforces "total calls ≠ round number" rule
- **Playing Phase**: Track hands won with visual feedback
- **Scorecard**: Full game scorecard with running totals
- **Offline-First**: MMKV local storage for instant saves
- **Dark Mode**: Automatic theme support
- **Cross-Platform**: Works on iOS, Android, and Web

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript (strict mode)
- **UI Library**: Tamagui (cross-platform components)
- **Backend**: Convex (ready to integrate)
- **Local Storage**: React Native MMKV
- **State Management**: React hooks + MMKV

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd rung-score-keep
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. (Optional) Set up Convex backend:
```bash
npx convex dev
```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Project Structure

```
app/
├── _layout.tsx           # Root layout with Tamagui provider
├── index.tsx             # Home screen
├── new-game.tsx          # Game setup screen
└── game/[id].tsx         # Main game screen

components/
├── ui/                   # Base UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
└── game/                 # Game-specific components
    ├── CallingMode.tsx
    ├── PlayingMode.tsx
    ├── ScorecardMode.tsx
    ├── TrumpCard.tsx
    ├── TrumpCardPicker.tsx
    ├── PlayerCard.tsx
    └── ScoreTable.tsx

convex/
├── schema.ts             # Database schema
├── games.ts              # Game mutations & queries
└── rounds.ts             # Round mutations & queries

lib/
├── mmkv.ts               # MMKV storage instance
└── hooks/
    └── useMMKV.ts        # MMKV React hooks

utils/
├── constants.ts          # Game constants (scoring table, suits, ranks)
├── scoring.ts            # Scoring calculations
├── validation.ts         # Game rule validations
└── trump.ts              # Trump card utilities
```

## Game Rules Implementation

### Scoring
- Points awarded only when hands won = call
- Scoring: `points = call × 5 + 5`
- Examples: Call 0 = 5pts, Call 1 = 10pts, Call 2 = 15pts

### Trump Card
- Auto-generated based on remaining cards: `52 - (round × players)`
- Dealer can override to match physical deck
- No trump when entire deck is dealt

### Critical Validation
**Total Calls ≠ Round Number**
- Sum of all calls must NOT equal the round number
- Enforced on dealer (last to call)
- Prevents situations where everyone makes their call

Example (Round 5, 3 players):
- Player 1 calls 2
- Player 2 calls 3
- Dealer CANNOT call 0 (would make total = 5)

## Development

### Adding New Features

1. Create components in `components/`
2. Add utilities in `utils/`
3. Update Convex schema if needed
4. Test on all platforms

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Tamagui for styling
- MMKV for local storage

## Roadmap

- [x] Phase 1: Project setup
- [x] Phase 2: Data layer (utilities, schema)
- [x] Phase 3: UI components
- [x] Phase 4: Game setup flow
- [x] Phase 5: Calling phase
- [x] Phase 6: Playing phase
- [x] Phase 7: Game management
- [ ] Phase 8: Polish & optimization
- [ ] Phase 9: Testing & deployment

### Future Enhancements

- Real-time multiplayer (Convex integration)
- Game history/archive
- Export scorecard as PDF
- Player statistics
- Tournament mode
- Voice input for calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple platforms
5. Submit a pull request

## License

MIT

## Acknowledgments

Built following modern React Native best practices with Expo, Tamagui, and Convex.
