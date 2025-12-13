# Project Overview

Build a cross‑platform whiskey Advent calendar app for a private group of friends who run a yearly whiskey Advent exchange around Christmas. The app should run on Web, Android, and iOS, and the preferred tech stack is React with Vite for the frontend, plus whatever backend the tool recommends.

The app’s core purpose is to replace the organizer’s spreadsheet with a proper system for:

- Managing users and roles  
- Collecting bottle submissions each year  
- Revealing each day’s whiskey in December  
- Enabling comments and discussion  
- Tracking spending and settle‑up amounts  
- Maintaining a historical archive of bottles  
- Optionally suggesting bottles to buy using AI  

Assume a small, private group (10–30 users) and light traffic; prioritize simplicity over massive scalability.

---

## Platforms and Tech

**Platforms**

- Web app (desktop and mobile web)  
- Mobile: Android and iOS (via React Native, Expo, Capacitor, or a PWA; pick one approach and document it)

**Frontend**

- React + Vite for the main UI and build tooling  
- PrimeReact as the primary UI component library (details below)

**Backend and Infrastructure**

- The AI coding tool can choose a suitable backend stack (e.g., Node/Express, NestJS, or a BaaS such as Firebase/Supabase), but it must support:
  - Authentication with social providers  
  - Role‑based access control  
  - Persistent database storage (SQL or NoSQL)  
  - Email and/or push notification mechanisms  

Include basic environment‑based configuration (dev vs prod) and simple logging/error handling.

---

## User Types and Roles

### Regular User

- Authenticates with social login (Google, Apple, Facebook, etc.)  
- Submits the bottle they are bringing for a given year (one bottle per Event)  
- Views their daily whiskey reveal during December  
- Reads whiskey information once revealed  
- Posts and reads comments on each whiskey/day  
- Adds their own tasting notes and ratings  
- Views their own history of bottles brought in past years  
- Views their spending and any “settle up” balance  

### Admin

- All capabilities of a regular user  
- Creates and manages yearly calendars (e.g., “Whiskey Advent 2025”)  
- Assigns users to a given year/Event  
- Manages bottle submissions and ensures each calendar day is assigned to a bottle  
- Controls visibility/reveal schedule for each day’s whiskey (automatic by date and manual override)  
- Posts announcements / blog‑style updates for events and meetup dates  
- Manages messaging/notifications to all participants  

---

## Core Domain Model

Design the database and API around these entities.

### User

- Fields: `id`, `name`, `email`, `avatar` (optional), `auth_provider`, created_at, updated_at  
- `role`: enum (`user`, `admin`)  
- Relationships: belongs to many `Event`s (through `EventMembership`)

### Event / Year

Represents one Advent season (e.g., “2025”).

- Fields: `id`, `name`, `year`, `start_date` (December 1), `end_date` (December 24), `description`, `created_by`, `status` (`planned` / `active` / `completed`)  
- Relationships:
  - Has many `BottleSubmission`s  
  - Has many `CalendarDay`s (1–24)  
  - Has many `Announcement`s  
  - Has many `EventMembership`s (user list for this Event)

### EventMembership

Explicit membership of a user in an Event.

- Fields: `id`, `event_id`, `user_id`, `role_override` (optional), `created_at`  
- Used to restrict visibility so only members see an Event’s data

### BottleSubmission

Represents one user’s bottle for a given year.

- Fields:
  - `id`, `event_id`, `user_id`  
  - `whiskey_name`  
  - `distillery`  
  - `country`  
  - `style` / `type` (e.g., Scotch single malt, bourbon)  
  - `abv`  
  - `volume`  
  - `price`  
  - `purchase_location_url`  
  - `notes` / `description`  
  - Optional external product link  
  - Cost used for settle‑up calculations

### CalendarDay

Represents each box slot (Day 1–24) for a given Event.

- Fields:
  - `id`, `event_id`  
  - `day_number` (1–24)  
  - `bottle_submission_id` (which bottle is assigned to this day)  
  - `reveal_date` (usually `event.start_date + day_number - 1`)  
  - `is_revealed` (boolean, computed by date but overrideable by admin)

### TastingEntry

Per user per day.

- Fields:
  - `id`, `event_id`, `calendar_day_id`, `user_id`  
  - `rating` (e.g., 1–10)  
  - `tasting_notes` (free text)  
  - `would_buy_again` (boolean)  
  - `created_at`, `updated_at`

### Comment

Discussion around a specific day/bottle.

- Fields:
  - `id`, `event_id`, `calendar_day_id`, `user_id`  
  - `content`  
  - `created_at`, `updated_at`

### SpendingRecord / Settlement

Represents how much each user spent in a given year and what they owe or are owed after averaging.

- Fields:
  - `id`, `event_id`, `user_id`  
  - `amount_spent` (from the bottle price)  
  - `average_target` (calculated average per participant)  
  - `balance` (positive = others owe them; negative = they owe others)

### Announcement / BlogPost

Messages to all participants: meetup dates, distribution dates, general notes.

- Fields:
  - `id`, `event_id`  
  - `title`  
  - `body`  
  - `created_at`  
  - `created_by`

---

## Authentication and Authorization

### Authentication

- Support social login providers: Google, Apple, Facebook  
- Session management suitable for web and mobile (e.g., JWT or secure cookies)

### Authorization

- Only admins can create/edit `Event`s, assign `CalendarDay`s, and post `Announcement`s  
- Only members of an Event can read that Event’s bottles, comments, tasting entries, and spending information  
- Users can only edit their own `BottleSubmission`s, `TastingEntry`s, and `Comment`s  
- Admins can moderate (edit/delete) any comment if necessary  

---

## Key Features

### 1. Yearly Whiskey Advent Setup

- Admin creates a new `Event` (year) with basic info and date range  
- Admin invites or associates users to the Event via `EventMembership`  
- Each participant submits exactly one bottle for that year via a form capturing:
  - Name  
  - Distillery  
  - Country  
  - Style  
  - Price  
  - Link  
  - Notes, etc.  
- The system stores this and associates the bottle with that user and year

### 2. Calendar Day Assignment and Secrecy

- Admin UI to:
  - See all `BottleSubmission`s for the Event  
  - Assign each bottle to a `CalendarDay` (1–24)  
- Participants should not see which bottle is on which day until that day’s reveal  
- For each `CalendarDay`:
  - Before `reveal_date`: show only “Day X” (no whiskey details)  
  - On/after `reveal_date` (or if toggled revealed by admin): show full whiskey details  

### 3. Daily Experience (December Usage)

- For each Event, a logged‑in user can view a calendar or list of days (1–24)  
- On a given day:
  - User sees the whiskey assigned to that day (once revealed)  
  - Display whiskey info (distillery, country, price, description, etc.)  
  - User can add a `TastingEntry` (notes, rating, would‑buy‑again flag)  
  - User can read and post `Comment`s about that day’s whiskey  

### 4. Comments and Discussion

- Per‑day comment thread, attached to `CalendarDay` and `Event`  
- Features:
  - Create, edit, delete own comment  
  - List all comments for that day in chronological order  
  - Show commenter name and avatar where available  

### 5. Spending and Settle‑Up

- Each `BottleSubmission` includes the actual amount spent (e.g., around $100+, but any value)  
- For each Event:
  - Compute the average spend across all participants  
  - For each user, compute `balance = amount_spent - average_spent`  
- UI: “Settle Up” page for the current Event:
  - List of participants, `amount_spent`, `average_target`, and `balance`  
  - Clear indication who should pay and who should receive (actual transactions handled offline)  

### 6. History and Profiles

- User profile page:
  - List of Events the user participated in  
  - For each Event, show:
    - Bottle they brought that year  
    - Summary of their tasting notes/ratings for that year  
- Event history:
  - Browse past Events  
  - For each Event and day, show which whiskey was used and aggregate ratings/comments  

### 7. Announcements / Blog

- Admin can post announcements on an Event (e.g., meetup dates for distributing the mini bottles, reminders, notes)  
- Participants see a feed of these posts in a “News” or “Announcements” section  
- Optional: basic notifications (email or in‑app) when new announcements are posted  

### 8. Messaging / Notifications

- Provide at least:
  - Announcement posts plus in‑app notification indicators (e.g., badge on nav item)  
- Optional stretch:
  - Push notifications to mobile when:
    - A new day is revealed  
    - A new announcement is posted  

---

## Optional AI “Shopping Ideas” Feature

Lower priority; can be implemented later.

### Goal

- Help a participant decide which whiskey to buy for their bottle submission

### Flow

- User answers a small questionnaire:
  - Budget range  
  - Preferred style (Scotch, bourbon, etc.)  
  - Country preferences  
  - Flavor notes (smoky, peaty, fruity, etc.)  
- The app uses AI and/or external APIs to suggest candidate bottles and possibly link to purchase pages  

### Output

- List of suggested bottles with name, distillery, approximate price, and external links  

---

## UI/UX Requirements

- Focus on a small friend group, not a public social network  
- Main sections for a logged‑in user:
  - Current Event dashboard (calendar view and today’s whiskey)  
  - My Bottle (submission form and details for this year)  
  - Settle Up  
  - History  
  - Announcements  
  - Profile & Settings  
- Admin additional sections:
  - Event management  
  - Day assignment tool  
  - Bottle list  
  - Announcement composer  

Include basic input validation, error messages, and loading states for all main flows.

---

## UI Library and Styling (PrimeReact)

Use **PrimeReact** as the primary React UI component library for all major UI elements (forms, buttons, tables, dialogs, menus, calendars, toasts, etc.).

### Installation and Setup

- Install PrimeReact, PrimeIcons, PrimeFlex, and a theme package  
- Configure global CSS imports for:
  - The chosen PrimeReact theme  
  - PrimeFlex (layout utilities)  
  - PrimeIcons  

### Theming and Branding

- Choose a base theme that is easy to customize (e.g., `lara-light-indigo` / `lara-dark-indigo` or another modern theme)  
- Use PrimeReact’s theme/CSS‑variable system or SCSS customization to define a custom color palette that matches the whiskey Advent brand (primary, secondary, accent, background, success/error, etc.)  
- Support both light and dark modes via theme variants, with a toggle stored in user preferences  

### Component Usage Guidelines

- Forms:
  - Use `InputText`, `Dropdown`, `MultiSelect`, `Calendar`, `InputNumber`, and `InputTextarea` for bottle submission forms, filters, and profile/settings pages  
- Navigation:
  - Use `Menubar` or `TabMenu` for main navigation on desktop  
  - Use a responsive `Sidebar`/drawer pattern for mobile  
- Data display:
  - Use `DataTable` for participants, spending/settle‑up overview, and bottle history  
  - Use `Card`, `Panel`, `Accordion`, and `Timeline` where appropriate for events and announcements  
- Feedback:
  - Use `Toast` and `Message`/`InlineMessage` for success/error notifications (e.g., bottle submitted, comment posted, settlement updated)  
- Modals and overlays:
  - Use `Dialog`, `OverlayPanel`, and `ConfirmDialog` for edit/create flows and confirmations  

### Layout and Responsiveness

- Use PrimeFlex (or CSS Grid/Flexbox) alongside PrimeReact components to create responsive layouts for mobile and desktop  
- Ensure all key flows (daily calendar, bottle submission, settle‑up, comments, announcements) are optimized for small screens first  

### Accessibility and UX

- Leverage PrimeReact’s built‑in ARIA and keyboard navigation, and ensure any custom components follow the same patterns  
- Maintain consistent spacing, typography, and component usage via centralized theme tokens and shared layout components (e.g., a standard page layout and section headers)  

---

## Non‑Functional Requirements

- Data privacy: Only members of a given Event can see that Event’s bottle details, comments, tasting entries, and spending  
- Simple deployment: Allow the AI tool to choose the deployment stack, but it should be practical for a small private group (e.g., a single backend service plus managed database)  
- App should be responsive and mobile‑friendly  
- Include minimal test coverage (unit/integration smoke tests) for critical flows if the AI tool supports generating tests
---

## Implementation Status

This section tracks the current implementation status of the app.

### Tech Stack (Implemented)

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: PrimeReact + PrimeFlex + PrimeIcons
- **Backend**: Supabase (Auth, PostgreSQL Database, Row Level Security)
- **Mobile**: Progressive Web App (PWA) via vite-plugin-pwa
- **Deployment**: Vercel (recommended)

### Implemented Features

#### Authentication & Authorization ✅
- Email/password authentication
- Social login support (Google, Apple, Facebook) via Supabase Auth
- Auto-redirect for logged-in users visiting login page
- Protected routes with role-based access control
- Profile auto-creation on first login

#### Dashboard & Calendar ✅
- Advent calendar grid showing days 1-24
- Real-time data from Supabase (no dummy data)
- Auto-reveal based on `reveal_date` field (days unlock automatically)
- Manual reveal override by admin
- Visual indicators for today, revealed, and locked days

#### Bottle Submissions ✅
- User bottle submission form with full details
- Admin Bottle Management page (`/admin/bottles`)
  - View all submissions for any event
  - Edit any user's bottle
  - Create bottles on behalf of users who haven't submitted

#### Day Detail Page ✅
- Whiskey details display (name, distillery, country, style, ABV, price, notes)
- Comments section with real-time posting
- Tasting notes form (rating 1-10, notes, would-buy-again)
- Proper empty states for unrevealed/unassigned days

#### Announcements ✅
- Real-time announcements fetched from database
- Admin announcement editor with create/edit/delete
- Timeline display on announcements page

#### Admin Features ✅
- Event Management - create and manage yearly events
- Day Assignment - assign bottles to calendar days, toggle reveals
- Member Management - view users, change roles
- Bottle Management - edit/create bottles for any user
- Announcement Editor - post event updates

#### Data Hooks (Custom React Hooks) ✅
- `useEvents` - CRUD for events
- `useCurrentEvent` - get current year's event
- `useAnnouncements` - CRUD for announcements
- `useBottleSubmissions` - CRUD for bottle submissions
- `useCalendarDays` - manage calendar days and assignments
- `useEventMemberships` - manage event members
- `useUsers` - admin user management
- `useComments` - CRUD for day comments
- `useTastingEntry` - save/load user tasting notes

### Database Schema

Located in `supabase/migrations/`:
- `001_initial_schema.sql` - Core tables (profiles, events, bottles, calendar days, etc.)
- `002_simplified_rls.sql` - Row Level Security policies

### Pending Features

- [ ] Settle Up calculations (UI exists, needs real data integration)
- [ ] History page (past events browsing)
- [ ] Push notifications for new reveals/announcements
- [ ] AI bottle suggestion feature
- [ ] Email notifications

### Deployment

The app is deployed to **Vercel** with the following configuration:
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables configured in Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`