# Protoclone

A protocol editor inspired by [protocols.io](https://www.protocols.io) for creating and managing lab protocols. Built with Next.js, Tailwind CSS, Prisma + SQLite, and Auth.js.

## Setup

```bash
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register an account to get started.

### Google OAuth (optional)

To enable "Sign in with Google":

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com)
2. Enable the OAuth consent screen and create OAuth 2.0 credentials
3. Set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google`
4. Add to your `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## Features

### Protocol editor
- Create protocols with title, description, and step-by-step instructions
- Insert inline elements into steps: **Duration**, **Equipment**, **Amount**, **Temperature**, **Reagent**
- Elements render as colored chips inline with text
- Reorder steps with up/down arrows
- Auto-saves as you edit

### Auth
- Email + password registration and login
- Google OAuth (optional, requires credentials)
- Middleware redirects unauthenticated users to login

### Running protocols
- Click **Run** on any protocol to start a run
- Check off steps as you complete them (timestamps recorded)
- Add notes to each step during the run
- Click numeric chips (amounts, temperatures, durations) to modify values during the run — deviations from the original protocol are tracked
- Progress bar shows completion status
- Mark run as completed when done
- View past runs from the protocol page

### Version control
- Click **Save Version** to create a named snapshot of the current protocol
- View version history with timestamps and messages
- Restore any previous version with one click

### Forking
- Click **Fork** to create a copy of any protocol (yours or public ones)
- Forks track their parent protocol
- "Forked from" banner links back to the original

### Step-level comments
- Click the comment icon on any step to open a discussion thread
- Add comments visible to all collaborators
- Comment counts shown on each step

### Sharing
- Toggle protocols between **Public** and **Private**
- Public protocols appear in other users' home page
- Private protocols are only visible to the author

### PDF export
- Click **Export PDF** to open a print-friendly view
- Use the browser's print dialog to save as PDF

### Search
- Filter protocols by title from the home page

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Prisma + SQLite** (file-based, no external DB needed)
- **Auth.js** (next-auth v5) with Credentials + Google providers
- **bcryptjs** for password hashing

## Build

```bash
npm run build
npm start
```
