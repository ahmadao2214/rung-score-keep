# Convex Backend Setup

## Initial Setup

To initialize Convex for this project, run:

```bash
npx convex dev
```

This will:
1. Create a new Convex deployment
2. Generate a `.env.local` file with your deployment URL
3. Start the Convex development server

## Environment Variables

After running `npx convex dev`, you'll have a `.env.local` file with:

```
CONVEX_DEPLOYMENT=dev:...
CONVEX_URL=https://...
```

Make sure to add `.env.local` to your `.gitignore` (it should already be there).

## Deploying to Production

When ready to deploy:

```bash
npx convex deploy
```

## File Structure

- `schema.ts` - Database schema definitions
- `games.ts` - Game-related mutations and queries
- `rounds.ts` - Round-related mutations and queries
