# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vũng Tàu Escape** is a premium travel editorial app for planning trips to Vũng Tàu, tracking expenses with fund contributions and split payments, and sharing photo memories. Built as a React SPA with Supabase backend.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS 4 (with @tailwindcss/vite plugin), custom Material 3-inspired design tokens
- **Animation**: Motion (Framer Motion fork)
- **Backend**: Supabase (PostgreSQL + Storage)
- **Routing**: React Router v7
- **Icons**: lucide-react

## Development Commands

```bash
# Install dependencies
npm install

# Run dev server (http://localhost:3000)
npm run dev

# Type checking / lint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview

# Clean build artifacts
npm run clean
```

## Environment Setup

Required environment variables (create `.env.local`):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase credentials are required for the app to function. See `.env.example` for template.

## Database Schema

The app uses 5 main tables in Supabase:

1. **participants** - Trip members (name, initials, color_class)
2. **activities** - Itinerary items per day (day, time, period, title, location, location_url, description, image_url)
3. **expenses** - Expense tracking (payer_id, reason, category, amount, date)
4. **expense_participants** - Junction table for split payments (expense_id, participant_id)
5. **memories** - Photo gallery (title, caption, image_url, aspect_ratio)
6. **fund_contributions** - Fund pooling system (participant_id, amount)

Schema migration SQL is in `supabase_schema.sql`. Initial data for activities is also included there.

## Architecture

### Route Structure

- `/` → redirects to `/itinerary`
- `/itinerary` → Day-by-day trip planning (2-day itinerary hardcoded)
- `/expenses` → Expense tracking, fund contribution, and settlement
- `/memories` → Photo gallery with upload to Supabase Storage

### Component Hierarchy

```
App.tsx
└── ToastProvider
    └── BrowserRouter
        └── Layout (navigation + header)
            └── Outlet (route content)
                ├── Itinerary
                ├── Expenses
                │   └── FundContributionView (conditional)
                └── Memories
```

### Shared Components

- **Layout** - Top nav (desktop) + bottom nav (mobile), profile avatar
- **Toast** - Global toast notifications via context (5s auto-dismiss)
- **ConfirmModal** - Confirmation dialogs for destructive actions (delete activity/expense/participant)

### Data Flow

All data is fetched/mutated via helper functions in `src/lib/supabase.ts`:
- `getActivities()`, `addActivity()`, `deleteActivity()`, `updateActivity()`
- `getParticipants()`, `addParticipant()`, `deleteParticipant()`
- `getExpenses()`, `addExpense()`, `deleteExpense()`, `updateExpense()`
- `getMemories()`, `addMemory()`, `deleteMemory()`
- `getFundContributions()`, `addFundContribution()`
- `uploadImage()` - Uploads to Supabase Storage bucket 'memories'

State is managed locally in components (useState + useEffect). No global state library.

## Key Features & Implementation Notes

### Itinerary Management

Activities are grouped by day (day 1 = Sunday 26/04, day 2 = Monday 27/04). Each activity has:
- Time + period (Sáng/Trưa/Chiều/Tối)
- Title, location (with optional Google Maps URL), description
- Optional image (URL-based)

When editing activities, the form auto-populates `location_url` for Google Maps integration. Images are displayed inline within the timeline cards.

### Expense Tracking & Fund System

**Fund Contributions**: Separate view (`/expenses?view=fund`) where participants contribute to a shared fund pool before the trip.

**Expense Splitting**: When adding an expense:
- Defaults to splitting among ALL participants (no manual selection in current UI)
- Uses junction table `expense_participants` to track who's included in each split
- Displays total fund, total spending, and remaining balance

**Categories**: Expenses can be categorized (Ẩm thực, Di chuyển, Giải trí, Lưu trú, Khác).

**Settlement**: "Kết thúc hành trình" button shows preview modal but doesn't implement final settlement calculation yet.

### Memory Gallery

- Upload images via file input → Supabase Storage bucket 'memories'
- Masonry layout using CSS columns (responsive: 1/2/3 columns)
- Each memory has title, caption, and aspect ratio (default: aspect-[4/5])
- Upload modal allows editing title/caption before saving

### Design System

Custom color palette inspired by Material 3:
- Primary: `#005c8d` (ocean blue)
- Secondary: Gold/brown tones
- Accent: `#ffdc2e` (sunshine yellow)
- Backgrounds: Warm beige (`#f2f0df`, `#f5f5e9`)

Typography uses two custom fonts (loaded via CSS `@font-face`):
- `font-headline` - Bold display text (titles, headers)
- Default - Body text

Rounded corners are generous (2rem - 3rem for cards/modals).

## Common Patterns

### Adding a New Modal

1. Create state: `const [isModalOpen, setIsModalOpen] = useState(false);`
2. Use `AnimatePresence` + `motion.div` for enter/exit animations
3. Backdrop: `bg-black/40 backdrop-blur-sm` with onClick to close
4. Modal content: `bg-surface-container-lowest rounded-3xl shadow-2xl`

### Deleting Records

Always use `ConfirmModal` for destructive actions:

```tsx
setConfirmConfig({
  isOpen: true,
  title: 'Xóa hoạt động',
  message: 'Bạn có chắc chắn muốn xóa?',
  type: 'danger',
  onConfirm: async () => {
    await deleteActivity(id);
    // refresh state
  }
});
```

### Showing Toasts

```tsx
const { showToast } = useToast();
showToast('Thêm hoạt động thành công', 'success');
showToast('Xóa thất bại', 'error');
```

## Known Issues & Limitations

1. **Hardcoded Trip Dates**: Itinerary is hardcoded for 26-27 April. To support other dates, refactor day filtering logic.
2. **Image URLs**: Activities and memories use URL-based images (not file upload). Only memories component has upload to Supabase Storage.
3. **Participant Removal**: Deleting a participant cascades to delete all their expenses (DB foreign key constraint).
4. **No Authentication**: App has public access policies (demo mode). For production, implement Supabase Auth.
5. **Settlement Calculation**: "Kết thúc hành trình" doesn't compute who owes whom yet.
6. **Missing Fund Contributions Table**: Schema includes `fund_contributions` but migration SQL to create it may be incomplete. Check if table exists in Supabase dashboard.

## File Organization

```
src/
├── components/          # UI components
│   ├── Layout.tsx       # Nav wrapper
│   ├── Itinerary.tsx    # Itinerary view
│   ├── Expenses.tsx     # Expense tracking
│   ├── Memories.tsx     # Photo gallery
│   ├── FundContributionView.tsx  # Fund pooling
│   ├── Toast.tsx        # Toast provider + hook
│   └── ConfirmModal.tsx # Confirmation dialog
├── lib/
│   ├── supabase.ts      # Supabase client + data helpers
│   └── utils.ts         # cn() utility for className merging
├── types.ts             # TypeScript interfaces
├── constants.ts         # Empty (data moved to Supabase)
├── index.css            # Global styles + Tailwind directives
├── main.tsx             # React entry point
└── App.tsx              # Root component with routing

```

## Adding New Features

### Example: Add a new expense category

1. Update category select in `src/components/Expenses.tsx` line ~514
2. Optionally add to `supabase_schema.sql` default value
3. No backend change needed (category is free-text field)

### Example: Add authentication

1. Enable Supabase Auth in dashboard
2. Update RLS policies in `supabase_schema.sql` (replace `TO anon` with row-level checks)
3. Add auth UI (sign in/up) via `@supabase/auth-ui-react`
4. Wrap App in auth check, redirect unauthenticated users

## Testing Database Connection

The app will show warnings in console if Supabase credentials are missing. To verify connection:

1. Check browser DevTools → Network tab for requests to `supabase.co`
2. If queries fail, verify `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run schema SQL in Supabase SQL editor if tables don't exist

## Notes for Claude

- Vietnamese UI text: Keep all user-facing strings in Vietnamese (current practice)
- Participant colors: Use existing color classes (`bg-primary-fixed`, `bg-secondary-fixed`, etc.)
- When adding new Supabase queries, follow the pattern in `src/lib/supabase.ts` (async functions with error handling)
- The app assumes 10 participants max (hardcoded in `supabase_schema.sql` initial data)
