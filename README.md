# SI Sheet

A clean, local-first DSA lab tracker for Smart Interviews and LeetCode practice. SI Sheet helps you keep one organized place for assigned problems, topic progress, lab dates, revision planning, notes, and imported problem links.

![SI Sheet](public/favicon.png)

## What It Does

SI Sheet is built for students who want a simple way to track DSA lab progress without depending on an account or backend. Your progress is stored in the browser, so the app stays fast and private.

With SI Sheet you can:

- Track each problem as `Not Started`, `In Progress`, or `Completed`.
- Mark difficult problems for revision.
- Add notes for individual problems.
- Filter problems by topic, lab date, platform, status, and revision state.
- View topic-wise and lab-wise progress.
- Import new problems from URLs, pasted metadata, or manual entry.
- Detect duplicates before importing new records.
- Export progress and dataset backups.
- Switch between dark and light themes.

## Main Features

### Dashboard

The dashboard gives a quick overview of total problems, completion percentage, active problems, revision queue, and topic progress.

### Problems View

Browse the complete problem list with filters and sorting. Each row shows the platform, topics, lab dates, status, revision flag, notes, and external problem link.

### Topics View

Understand which DSA topics need more attention. SI Sheet groups problems by topic and shows completion status for each area.

### Labs View

Review problems according to assigned lab dates. This is useful when following a college or Smart Interviews lab schedule.

### Revision Queue

Keep tricky problems in one place so you can revisit them before tests, interviews, or contests.

### Problem Import

Add problems without editing source code manually. The import workflow supports:

- URL-based import
- Pasted problem metadata
- Manual problem entry
- Preview before saving
- Duplicate detection
- Add-lab-date handling for existing problems
- Undo last import
- Dataset export

## Tech Stack

- React
- TypeScript
- Vite
- Lucide React icons
- Oxlint
- Browser `localStorage` for persistence

## Getting Started

### Prerequisites

Install Node.js and npm on your machine.

### Installation

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
SI-Sheet/
├── public/              # Favicons and static assets
├── src/
│   ├── components/      # UI views and reusable components
│   ├── context/         # Tracker state and localStorage persistence
│   ├── data/            # Base problem dataset, importer, validator
│   ├── types/           # Shared TypeScript types
│   ├── App.tsx          # Main app routing by active view
│   └── main.tsx         # React entry point
├── index.html           # App title, favicon, meta tags
├── package.json         # Scripts and dependencies
└── README.md            # Project documentation
```

## Data and Privacy

SI Sheet is local-first. It does not require login, a database, or an API key.

The app stores data in your browser using `localStorage`:

- Problem progress
- Notes
- Revision flags
- Theme preference
- Imported dataset records
- Import history

Because the data is stored locally, clearing browser storage can remove your progress. Use the export options inside the app to keep backups.

## Environment Variables

No `.env` file is required for the current version.

If future features need API keys or external services, create a local `.env` file and expose only Vite-safe variables prefixed with `VITE_`.

Example:

```env
VITE_API_URL=https://example.com
```

Do not commit real secrets. The `.gitignore` already excludes `.env` files.

## Deployment

This is a static Vite app. You can deploy the production output from the `dist/` folder to services like Vercel, Netlify, GitHub Pages, or any static hosting provider.

Build first:

```bash
npm run build
```

Then deploy the generated `dist/` directory.

## Notes for Contributors

- Keep progress-related data separate from the base problem dataset.
- Validate dataset changes before release.
- Avoid committing `node_modules/`, `dist/`, `.env`, or machine-specific files.
- Prefer small, focused changes that match the existing UI style.

## License

This project is currently private/personal. Add a license file if you plan to publish it publicly.
