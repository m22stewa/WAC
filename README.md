# WAC — Whiskey Advent Calendar

A Progressive Web App for managing a private whiskey Advent calendar exchange among friends. Built with React, TypeScript, Vite, and Supabase.

## Features

### For Members
- **Bottle Submissions** - Submit your whiskey bottle with details, images, and purchase links
- **Daily Reveals** - Discover a new bottle each day of Advent (December 1-24)
- **Tasting Notes** - Rate bottles (1-10), add private tasting notes, mark bottles you'd buy again
- **Comments** - Discuss each day's bottle with other members
- **Settle Up** - Track costs and settlement status for the year
- **Announcements** - Stay updated with group news and updates
- **History** - Browse past years' calendars and bottles

### For Admins
- **Event Management** - Create and manage calendar years
- **Day Assignment** - Assign bottles to specific calendar days
- **Member Management** - Manage users, roles, and waiting list with drag-drop ordering
- **Bottle Management** - View all submissions with placement info, edit any bottle
- **Announcements** - Post updates to all members
- **Data Export** - Export complete calendar data to CSV (members, bottles, settlements, ratings, comments)

### Design
- **Custom Branding** - WAC icon and Poppins typography throughout
- **Responsive** - Works on desktop, tablet, and mobile
- **Theme Toggle** - Light and dark mode support
- **PWA Ready** - Installable as a native app

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Supabase:**
Create `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```
Add your Supabase URL and anon key.

3. **Run migrations:**
Apply all migrations in `supabase/migrations/` to your Supabase database in order (001-013).

4. **Start development:**
```bash
npm run dev
```

5. **Build for production:**
```bash
npm run build
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI Library:** PrimeReact with custom Poppins font
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions

## Database Schema

- `profiles` - User accounts and roles (admin, user, waiting_list)
- `events` - Calendar years
- `event_memberships` - User participation in events
- `bottle_submissions` - Whiskey bottle details with images
- `calendar_days` - 24-day calendar with bottle assignments
- `tasting_entries` - User ratings and notes
- `comments` - Daily discussions
- `settlements` - Cost tracking per user per year
- `announcements` - Group updates

## Contributing

Follow the existing code style and linting rules. All TypeScript errors must be resolved before merging.

## License

MIT

## Repository

https://github.com/m22stewa/WAC
