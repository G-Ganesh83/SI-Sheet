# SI Sheet

A modern, cloud-synced DSA problem tracker and lab milestone companion for Smart Interviews and LeetCode practice. SI Sheet provides a high-density, Linear/Raycast-inspired workspace to track assigned lab problems, review tricky concepts, record personal notes, and sync progress seamlessly across devices via Supabase.

![SI Sheet](public/favicon.png)

---

## Features

### 🚀 Core Capabilities
- **Cloud-Synced & Real-Time**: Sign in with Google via Supabase to securely track and sync problem status, inline notes, and revision queues across all your devices with PostgreSQL and Row Level Security (RLS).
- **Problem Status Tracking**: Toggle problem states instantly across `Not Started`, `In Progress`, and `Completed`.
- **Revision Queue**: Star difficult or pattern-rich problems for focused revision before tests, interviews, or contests.
- **Personal Problem Notes**: Store inline notes, time/space complexity insights, and edge cases per problem with a dedicated modal and problem drawer.
- **Lab Milestones & Topic Grouping**: Follow assigned lab schedules (Lab 01 – Lab 09) and assess topic-by-topic DSA mastery.
- **Problem Detail Drawer**: Slide-out inspector drawer providing complete problem metadata, topic tags, lab dates, direct external links, and editable notes.
- **Admin Catalog Management**: Admin-gated catalog suite with atomic problem import, duplicate detection, lab date merging, and catalog editing.
- **Curated Dataset & Export**: 52+ curated DSA problems across 9 lab milestones, with full dataset export capabilities.
- **Polished Developer Aesthetic**: Engineered with dark and light themes, smooth micro-interactions, responsive desktop sidebar, and mobile-friendly navigation.
- **Safe Sign-Out UX**: Confirmation dialog before logout to prevent accidental session termination.
- **Admin Suite**: Role-gated administration dashboard with user management, problem importer/editor, and footer click analytics.

---

## Views & Workflow

- **Dashboard**: High-level metrics showing overall completion percentage, active problems, revision backlog, and topic progress bars.
- **Problems**: Searchable, filterable table with quick filters by platform, topic, status, lab milestone, and revision flag.
- **Topics**: Hierarchical view breaking down problem distribution and completion rates across data structures and algorithms.
- **Labs**: Milestone-based view structured around college lab sessions and scheduled assignments.
- **Revision**: Dedicated queue highlighting problems flagged for review with badge indicators.
- **Import (Admin)**: Add and validate new problem records or append lab dates with live preview and duplicate detection.
- **Users (Admin)**: View registered users, roles, and account activity.
- **Footer Clicks (Admin)**: Monitor outbound interactions and footer link analytics.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (Google OAuth, PostgreSQL database, Row Level Security)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS Design System with CSS variables (Dark/Light themes, responsive layout)
- **Analytics**: [@vercel/analytics](https://vercel.com/analytics)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/G-Ganesh83/SI-Sheet.git
cd SI-Sheet
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

> **Note**: A Supabase project is required for Google OAuth authentication, problem catalog access, and progress persistence.

### 3. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR |
| `npm run build` | Compiles TypeScript (`tsc -b`) and bundles for production (`vite build`) |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs `oxlint` for fast code linting |

---

## Project Structure

```text
SI-Sheet/
├── public/                     # Static assets & favicons
├── src/
│   ├── assets/                 # SVGs and brand assets
│   ├── components/
│   │   ├── admin/              # Admin views (Users, Footer Clicks)
│   │   ├── auth/               # Sign-in modal, loading screens, sign-out confirm popup
│   │   ├── common/             # Reusable UI (Drawer, Notes Modal, Badges, Toasts)
│   │   ├── dashboard/          # Summary metrics & topic progress cards
│   │   ├── import/             # Problem import workflow & preview
│   │   ├── labs/               # Milestone-based lab views
│   │   ├── layout/             # Desktop Sidebar & responsive AppLayout
│   │   ├── problems/           # Problems table, row items, and filter bar
│   │   ├── revision/           # Revision queue view
│   │   └── topics/             # Topic breakdown view
│   ├── context/                # AuthContext (Supabase Auth) & TrackerContext (State Management & Supabase Sync)
│   ├── data/                   # Default problem dataset, parser & schema validator
│   ├── lib/                    # Supabase client initialization
│   ├── services/               # Supabase data services (progressService, adminService, adminEditService)
│   ├── types/                  # TypeScript interfaces (auth, tracker, admin)
│   ├── App.tsx                 # Root layout & view router
│   ├── index.css               # Design system, CSS variables & theming
│   └── main.tsx                # Application entry point
├── supabase/                   # Supabase configuration, migrations, and seed data
│   ├── migrations/             # SQL schema migrations & RLS policies
│   └── seed.sql                # Initial database seed
├── .env.example                # Example environment variables template
├── package.json                # Project dependencies and npm scripts
└── README.md                   # Project documentation
```

---

## Data Architecture & Security

1. **Authentication (Supabase Auth)**:
   - Signs in using Google OAuth via Supabase Auth.
   - User sessions are handled with JWTs, and active user switching/logout cleanly flushes in-memory progress.
   - Safe sign-out confirmation modal prevents accidental session termination.

2. **Cloud Persistence (PostgreSQL & RLS)**:
   - User progress (problem status, inline notes, revision star flags, updated timestamps) is strictly persisted in PostgreSQL tables.
   - Protected by Row Level Security (RLS) policies ensuring users can only read and write their own problem progress records.
   - Zero problem progress is stored in browser `localStorage`.

3. **Problem Catalog & Admin Management**:
   - Centralized DSA problem catalog hosted on Supabase with public read access.
   - Role-gated administration permissions (`is_admin`) enable admins to edit catalog problems, batch-import new entries atomically, and view analytics.

4. **Client Preferences**:
   - UI theme preference (dark/light) is stored locally in the browser to prevent flash-of-unstyled-content (FOUC) on initial load.

---

## Deployment

Deployable as a static web app to [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), or any static hosting service:

```bash
npm run build
```

Configure your production environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`) in your hosting provider's dashboard, with the output directory set to `dist`.

---

## License

This project is created for personal and educational use.
