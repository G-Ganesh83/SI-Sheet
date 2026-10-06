# SI Sheet

A high-density, cloud-synchronized DSA tracking workspace built around Smart Interviews and LeetCode-style problem practice. SI Sheet provides a polished v2.1-era developer-tool environment for tracking problem statuses, flagging problems for revision, capturing personal solution intuition, and synchronizing progress across devices via Supabase.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tooling** | [Vite](https://vitejs.dev/) |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security) |
| **Authentication** | Supabase Auth with Google OAuth |
| **Deployment** | [Vercel](https://vercel.com/) |
| **Analytics** | [Vercel Analytics](https://vercel.com/analytics) |
| **Styling** | Modular Vanilla CSS under `src/styles/` |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Linter** | [Oxlint](https://oxc.rs/) |

---

## Workspaces

SI Sheet organizes problem practice into focused workspaces:

- **Dashboard**: High-density overview showing overall completion metrics, in-progress focus problems, revision backlog, and topic distribution.
- **Problems**: Searchable, filterable catalog table with instant query search, topic/lab filters, status selection, sorting controls, and quick actions.
- **Topics**: Algorithmic paradigm catalog organizing problems across data structures and patterns (Bit Manipulation, Trees, Dynamic Programming, Graphs, etc.) with completion metrics and drill-down tables.
- **Labs**: Milestone schedule mapping problems to assigned college and Smart Interviews lab sessions (Lab 01 – Lab 09).
- **Revision Queue**: Dedicated review queue for problems flagged for conceptual revisit, alternate approaches, or pre-interview drills.

---

## Product Capabilities

### 1. Authentication & User State
- **Google OAuth**: Fast single sign-on powered by Supabase Auth.
- **Public Catalog Browsing**: Anonymous visitors can freely browse the full problem catalog, filter by topics and labs, and inspect problem details without signing in.
- **Personal Progress Management**: Authenticated users track, update, and manage only their own progress.
- **Sign-Out Confirmation**: Explicit confirmation dialog protects users from accidental sign-outs.
- **Cross-Device Progress Synchronization**: Progress synchronizes seamlessly across devices through Supabase PostgreSQL with zero reliance on browser local storage.

### 2. Problem Tracking
- **Topic & Lab Organization**: Problems organized by algorithmic topics and chronological lab dates.
- **Status Workflow**:
  - `Not Started`
  - `In Progress`
  - `Completed`
- **Revision Marking**: Flag challenging problems with dedicated revision badges to assemble an actionable review backlog.
- **Personal Notes**: Inline and drawer-based personal notes editor for capturing complexity analysis, edge cases, and algorithmic intuition.
- **Search & Filtering**: Multi-parameter search and filtering across topics, labs, platforms, and problem titles.
- **Platform & Problem Links**: Direct outbound links to problem statements on Smart Interviews, LeetCode, HackerRank, and InterviewBit.
- **Problem Drawer / Details View**: Slide-out detail view offering metadata inspection, assigned lab dates, platform links, status/revision controls, and personal notes editing.

### 3. Admin Capabilities
- **Shared Catalog Management**: Centralized management of the shared problem catalog accessible to all users.
- **Admin-Only Catalog Import**: Atomic batch problem import workflow with duplicate validation and preview.
- **Admin Problem Editing**: In-place editing of catalog problem titles, URLs, topics, and platforms.
- **User Management View**: Administrative account oversight to inspect registered users and system access.
- **Footer Click Analytics**: Outbound link engagement tracking for administrative observability.

---

## Data Architecture & Security

- **Supabase PostgreSQL**: Stores both the shared problem catalog and individual user progress records.
- **Row Level Security (RLS)**: PostgreSQL RLS policies enforce isolation so authenticated users can modify only their own progress records (`status`, `revision`, `notes`, `updated_at`).
- **Anonymous Read-Only Access**: Anonymous users can read the public problem catalog without authentication.
- **Protected Server-Side Paths**: Administrative catalog operations and user management execute via protected server-side RPC functions and Edge Functions validating admin privileges.
- **Zero Progress in LocalStorage**: User progress is never stored in browser `localStorage`. Client-side persistence is restricted strictly to non-sensitive UI theme preferences (`si-sheet:theme`).
- **Credential Hygiene**: Sensitive environment secrets remain on server environments; client applications communicate strictly via publishable keys and authenticated bearer tokens without exposing credentials.

---

## UI / UX

- **Developer-Tool Visual Language**: Clean, dense, restrained interface inspired by modern developer platforms.
- **Light & Dark Themes**: Fully supported theme modes with persistent selection and zero flash-of-unstyled-content on initial load.
- **Responsive Layouts**: Designed for seamless use across desktop monitors, tablets, and mobile screens.
- **Responsive Mobile Navigation**: Dedicated mobile header and quick-access navigation bar.
- **Startup Loading Experience**: Branded terminal splash screen coordinated with real Supabase auth initialization.
- **Accessible Interactions**: Keyboard navigation support, visible focus rings, and proper ARIA semantics.
- **Reduced-Motion Support**: Respects system `prefers-reduced-motion` settings across all transitions and animations.
- **Consistent Empty / Loading / Error States**: Polished loading skeletons, inline error notices, and compact developer-tool empty states across all views.
- **Responsive Drawers & Dialogs**: Fluid slide-out problem drawer and modal dialogs with backdrop dismissal.

---

## Design System

The application styling follows a modular vanilla CSS architecture organized under `src/styles/`:

- **Design Tokens (`tokens.css`)**: Centralized design system tokens for surfaces, borders, typography, shadows, and status palettes.
- **Modular Styles Under `src/styles/`**:
  - `tokens.css`: Design tokens and light/dark theme variables.
  - `base.css`: Resets, typography scales, and custom scrollbars.
  - `layout.css`: App layout shell, desktop sidebar, and sticky headers.
  - `navigation.css`: Desktop sidebar navigation items and mobile bottom bar.
  - `tables.css`: Problem tables, row layouts, platform badges, and column formatting.
  - `forms.css`: Filter toolbar, search inputs, select dropdowns, and textareas.
  - `components.css`: Status badges, metric cards, problem counter tags, and empty states.
  - `modals.css`: Problem drawer, notes dialog, auth prompt, and sign-out confirmation.
  - `auth.css`: Terminal splash screen, Google OAuth button, and toast notifications.
  - `animations.css`: Micro-interactions, tactile press states, and keyframe transitions.
  - `responsive.css`: Media query breakpoints (375px, 480px, 768px, 1024px).
  - `admin.css`: Admin view tables, import forms, and analytics lists.
- **Semantic Status Colors**: Color is reserved strictly for meaningful states—`Not Started` (rose), `In Progress` (amber), `Completed` (emerald), and `Revision` (purple).
- **Neutral Navigation & Selection States**: Navigation links, active tab selections, dropdown menus, and focus rings remain clean neutral tones to preserve visual discipline.
- **Restrained Aesthetic**: High information density without decorative clutter or unnecessary visual weight.

---

## Project Structure

```text
SI-Sheet/
├── public/                     # Static assets, brand icons, and favicons
├── src/
│   ├── assets/                 # Vector brand marks and icons
│   ├── components/
│   │   ├── admin/              # Admin interfaces (Users, EditProblemModal, FooterClicks)
│   │   ├── auth/               # LoadingScreen, LoginView, AuthPromptModal, SignOutConfirm
│   │   ├── common/             # Shared UI (ProblemDrawer, NotesPopover, StatusBadge, Toast)
│   │   ├── dashboard/          # Metric summary cards, focus problems, and progress widgets
│   │   ├── import/             # Atomic problem importer with duplicate validation
│   │   ├── labs/               # Milestone-based lab views
│   │   ├── layout/             # Desktop sidebar, header, and mobile navigation
│   │   ├── problems/           # Problems catalog table, ProblemRow, and FilterBar
│   │   ├── revision/           # Revision queue view with empty states
│   │   └── topics/             # Algorithmic topic breakdown and drill-down tables
│   ├── context/                # AuthContext (Supabase Auth) & TrackerContext (State & Sync)
│   ├── data/                   # Seed catalog dataset and validation schemas
│   ├── lib/                    # Supabase client instantiation
│   ├── services/               # Supabase data services (progressService, adminService)
│   ├── styles/                 # Modular CSS architecture
│   │   ├── admin.css           # Admin views styling
│   │   ├── animations.css      # Transitions, theme transitions, and micro-interactions
│   │   ├── auth.css            # Startup screen, Google auth, and toast alerts
│   │   ├── base.css            # Resets, typography, and scrollbars
│   │   ├── components.css      # Badges, tags, overview cards, and empty states
│   │   ├── forms.css           # Search toolbar, select dropdowns, and inputs
│   │   ├── layout.css          # App layout shell, sidebar, and headers
│   │   ├── modals.css          # Drawer, notes dialog, and confirmation dialogs
│   │   ├── navigation.css      # Desktop navigation items and mobile bottom bar
│   │   ├── responsive.css      # Breakpoints (375px, 480px, 768px, 1024px)
│   │   ├── tables.css          # Problem data tables, rows, and platform tags
│   │   └── tokens.css          # Design tokens, color palettes, and theme variables
│   ├── types/                  # TypeScript interfaces (auth, tracker, admin)
│   ├── App.tsx                 # Root router and view layout coordinator
│   ├── index.css               # Main CSS bundle importing src/styles/
│   └── main.tsx                # Client mounting and entry point
├── supabase/                   # Supabase database migrations, seed data, and schema definitions
│   ├── migrations/             # Versioned SQL migrations & RLS policies
│   └── seed.sql                # Default catalog seed records
├── .env.example                # Example environment variables template
├── package.json                # Project dependencies and build scripts
└── README.md                   # Project documentation
```

---

## Development

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

Create a `.env` file based on the example template:

```bash
cp .env.example .env
```

Configure your Supabase project credentials in `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts the Vite development server with Hot Module Replacement |
| `npm run lint` | Runs `oxlint` for high-performance static code analysis |
| `npm run build` | Runs TypeScript type checking (`tsc -b`) and builds production bundle (`vite build`) |

---

## License

This project is created for personal and educational use.
