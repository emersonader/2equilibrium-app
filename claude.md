# Holistic Wellness Journey - Mobile App

## Custom Commands

When the user says these commands, follow the instructions:

### `read status` or `status`
Read the file `/Volumes/ExternalHome/Grumpy/2Equilibrium/STATUS.md` and summarize:
1. What was done in the last session
2. Current app state (what's working, what's pending)
3. Next steps to work on
Then ask the user what they'd like to work on.

### `update status`
Update the file `/Volumes/ExternalHome/Grumpy/2Equilibrium/STATUS.md` with:
1. Add a new session entry with today's date under "Session Log"
2. List what was accomplished this session
3. Update any completion status checkboxes
4. Update the "Next Steps" section based on current priorities
5. Add any relevant notes for the next session
Confirm the update was made and summarize what was recorded.

---

## Website Project

**Repo:** https://github.com/emersonader/2equilibrium.com.git
**Local Path:** `/Volumes/ExternalHome/Grumpy/2Equilibrium/website`

**IMPORTANT:** Do NOT make any changes to the website without asking the user first. The website is a separate project that runs alongside the mobile app, sharing the same Supabase backend.

---

## Project Overview

A subscription-based mobile app transforming Graziella Cialone de Souza's 30-day weight loss guide into a lifetime wellness companion. Built with React Native + Expo, Supabase backend, and RevenueCat for subscriptions.

**Brand:** 2Equilibrium
**Website:** www.2equilibrium.com
**Author:** Graziella Cialone de Souza (Nutrition and Lifestyle Coach)

## Brand Voice & Terminology

This app uses gentle, alternative wellness language:
- "Workouts" → "Daily Movement" or "Movement Rituals"
- "Exercise" → "Gentle Movement" or "Body Flow"
- "Diet" → "Nourishment" or "Eating Rhythms"
- "Weight loss" → "Wellness Journey" or "Body Harmony"

**Tone:** Encouraging, nurturing, never punishing.

## Design System

```
Primary Background: #FFFFFF (White)
Accent 1 - Luxury Orange: #E67E22 (warmth, energy, CTAs)
Accent 2 - Tiffany Blue: #0ABAB5 (calm, progress, success)
```

Clean, airy layouts with generous whitespace.

## Tech Stack

- **Framework:** React Native with Expo
- **Navigation:** Expo Router
- **State:** Zustand
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Subscriptions:** RevenueCat
- **Notifications:** expo-notifications

## Project Structure

```
/app
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/            # Tab navigation
│   │   │   ├── index.tsx      # Today screen
│   │   │   ├── journey.tsx    # Journey map
│   │   │   ├── journal.tsx    # Journal
│   │   │   └── profile.tsx    # Profile/settings
│   │   ├── lesson/[id].tsx    # Lesson detail
│   │   ├── chapter/[id].tsx   # Chapter detail
│   │   ├── quiz/[chapterId].tsx
│   │   └── onboarding/
│   │
│   ├── components/
│   │   ├── ui/                # Design system
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   └── Badge.tsx
│   │   ├── journey/
│   │   ├── quiz/
│   │   ├── journal/
│   │   └── subscription/
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── featureFlags.ts
│   │
│   ├── data/
│   │   ├── content/
│   │   │   ├── chapters.json   # 6 chapters for Phase 1
│   │   │   ├── lessons.json    # 30 daily lessons
│   │   │   └── quizzes.json    # 6 chapter quizzes
│   │   └── schema/
│   │       └── types.ts        # TypeScript definitions
│   │
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   └── utils/
│
├── assets/
├── package.json
├── app.json
└── tsconfig.json
```

## Content Structure

### Phase 1: Foundation (30 Days, 6 Chapters)

| Chapter | Title | Days | Theme |
|---------|-------|------|-------|
| 1 | Awakening Your Wellness Path | 1-5 | Setting intentions, hydration, body awareness |
| 2 | Nourishment Fundamentals | 6-10 | 70/30 rule, fiber, protein, carbs, fats |
| 3 | Mindful Eating Rituals | 11-15 | Chewing, portions, calorie density |
| 4 | Meal Architecture | 16-20 | Breakfast, lunch, dinner, beverages, swaps |
| 5 | Gentle Movement Foundations | 21-25 | Walking, post-meal movement, body flow |
| 6 | Mindset & Self-Compassion | 26-30 | Language, discipline, excuses, inner critic |

### Each Lesson Contains:
- Introduction and main content
- Key takeaways
- Action step
- Journal prompts (primary, reflection, gratitude)
- Movement suggestion (basic & personalized)
- Daily affirmation
- Nourishment tip

## Subscription Tiers

| Plan | Price | Per Month | Trial |
|------|-------|-----------|-------|
| Foundation (Monthly) | $29/mo | $29 | None |
| Transformation (6-Month) | $129 | ~$21.50 | 1-week free |
| Lifetime Wellness (Yearly) | $249 | ~$20.75 | None |

Feature access varies by tier (see `src/constants/featureFlags.ts`).

## Quiz System

- 7-8 questions per chapter
- 70% passing threshold
- Mix of multiple choice, true/false, reflection
- Failed topics mapped to review content
- Retry: 24-hour wait (Foundation/Transformation), Immediate (Lifetime)

## Key Features

1. **Daily Learning System** - Progressive unlock, one lesson per day
2. **Journal** - Mood, energy, water tracking, prompts
3. **Journey Map** - Visual progress through phases/chapters
4. **Quiz System** - Chapter completion validation
5. **Milestones** - Day 7, 14, 30, 60, 90, 180, 365 celebrations
6. **Offline Mode** - Content available without internet

## What's Built

### Completed (MVP Core)
- [x] Project setup (Expo, TypeScript, navigation)
- [x] Design system (colors, typography, spacing, shadows)
- [x] UI components (Button, Card, ProgressRing, Badge)
- [x] Tab navigation (Today, Journey, Journal, Profile)
- [x] Today screen with daily lesson preview
- [x] Journey map with chapter timeline
- [x] Journal with mood/energy/water tracking
- [x] Profile with stats and settings
- [x] Lesson detail screen with tabs
- [x] Chapter detail screen with lesson list
- [x] All 30 lessons content (JSON)
- [x] All 6 chapter quizzes (JSON)
- [x] TypeScript type definitions
- [x] Feature flags for tier-based access
- [x] Supabase integration (full schema, RLS, auth)
- [x] Quiz screen with pass/fail logic (70% threshold)
- [x] Quiz review screen for missed topics
- [x] Celebration modal with confetti animation
- [x] RevenueCat subscription integration
- [x] Subscription components (TierCard, TrialBanner)
- [x] Onboarding flow (4 screens: welcome, goals, experience, notifications, subscription)
- [x] Zustand stores (user, progress, journal, subscription)
- [x] Custom hooks (useProgress, useQuiz, useSubscription)
- [x] All service layers (auth, progress, journal, subscription, RevenueCat)

### Pending (Post-MVP)
- [ ] Push notifications implementation
- [ ] Offline content caching (expo-sqlite)
- [ ] Auth screens (login, signup, forgot password)
- [ ] Voice notes from Graziella (v1.1)
- [ ] Recipe library
- [ ] Movement video library
- [ ] Community features

## Running the App

```bash
cd app
npm install
npx expo start
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your-ios-key
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your-android-key
```

## Supabase Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Configure authentication providers as needed
4. Set up RevenueCat webhook to sync subscription status

## Key Files

- **Content:** `src/data/content/lessons.json` - All 30 days of lesson content
- **Quizzes:** `src/data/content/quizzes.json` - Chapter quizzes with questions
- **Types:** `src/data/schema/types.ts` - TypeScript definitions
- **Colors:** `src/constants/colors.ts` - Design system colors
- **Features:** `src/constants/featureFlags.ts` - Tier-based feature access
- **DB Schema:** `supabase/migrations/001_initial_schema.sql` - Full database schema
- **Stores:** `src/stores/` - Zustand state management
- **Services:** `src/services/` - Backend API integration
- **Hooks:** `src/hooks/` - Custom React hooks

## Plan Document

Full implementation plan with database schema, quiz flows, and milestone system:
`/Volumes/ExternalHome/Grumpy/.claude/plans/splendid-brewing-dragon.md`

## Source Content

Original guide material in `/Planner/` directory:
- `A Quick Guide To Weight loss .docx` - Main content source
- `Planner 6 x 9.docx` - Journal template

All content is copyrighted 2025 by 2Equilibrium.com
