# 2Equilibrium Wellness App

A subscription-based mobile app transforming Graziella Cialone de Souza's 30-day weight loss guide into a lifetime wellness companion.

## Features

- **30-Day Wellness Journey** - 6 chapters with daily lessons, quizzes, and progress tracking
- **Journal** - Track mood, energy, water intake with guided prompts
- **Apple Health Integration** - Sync steps, calories, heart rate, sleep, and weight
- **Nutrition Tracking** - Barcode scanner and manual food entry (in progress)
- **Subscription Tiers** - Monthly, 6-month, and yearly plans via RevenueCat

## Tech Stack

- **Framework:** React Native + Expo
- **Navigation:** Expo Router
- **State Management:** Zustand
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Subscriptions:** RevenueCat
- **Health:** @kingstinct/react-native-healthkit (iOS), react-native-health-connect (Android)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or physical device (for HealthKit)

### Installation

```bash
cd app
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your-ios-key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your-android-key
```

### Running the App

```bash
# Start Metro bundler
npx expo start

# For iOS with native modules (HealthKit)
npx expo run:ios --device
```

## Project Structure

```
app/
├── src/
│   ├── app/           # Expo Router screens
│   │   ├── (tabs)/    # Tab navigation
│   │   ├── (auth)/    # Auth screens
│   │   └── ...
│   ├── components/    # UI components
│   ├── services/      # API & backend services
│   ├── stores/        # Zustand state
│   ├── hooks/         # Custom React hooks
│   ├── constants/     # Design system
│   └── data/          # Content JSON files
└── ...
```

## Brand

**2Equilibrium** - www.2equilibrium.com

A holistic wellness approach using gentle, nurturing language:
- "Workouts" → "Gentle Movement"
- "Diet" → "Nourishment"
- "Weight loss" → "Wellness Journey"

## License

Copyright 2025 2Equilibrium.com. All rights reserved.
