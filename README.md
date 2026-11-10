# Weblign Store

A professional, modern e-commerce mobile application built with React Native, Expo, and Supabase.

## Tech Stack

- React Native + Expo (SDK 58)
- TypeScript
- Expo Router
- Supabase (Auth, Database, Storage)
- Razorpay (Indian payments)
- Expo Notifications

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Fill in `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_RAZORPAY_KEY_ID`.

3. Start the development server:

   ```bash
   npx expo start
   ```

## Project Structure

```
app/            # Expo Router routes
src/
  components/   # Reusable UI components
  constants/    # Theme, colors, spacing
  hooks/        # Custom hooks
  services/     # Supabase, notifications, payments
  stores/       # Zustand stores
  types/        # Shared TypeScript types
  utils/        # Helpers and formatters
```

## Notes

- Razorpay requires a development build (`expo-dev-client`); it does not run in Expo Go.
- Keep secrets out of the client bundle. Only `EXPO_PUBLIC_*` values are exposed.

## Database

Run supabase/migrations/001_initial_schema.sql in your Supabase SQL editor to create tables, RLS policies, and seed-ready structure.
