# Frontend

Next.js frontend for the Digital Forensic Evidence Preservation System.

## What This Frontend Currently Does

- Auth pages for registration and login
- Session persistence using `localStorage`
- Protected pages for authenticated users
- Dashboard showing evidence totals and AI status filters
- Evidence upload flow with drag-and-drop support
- Evidence detail page with file, AI, and blockchain summaries
- Verification page for hash and blockchain integrity checks
- Quarantine page for suspicious evidence
- Audit log page for monitoring system activity
- Admin panel for user role updates and evidence deletion

## Pages

- `/login` public login page
- `/register` public registration page
- `/dashboard` evidence overview for authenticated users
- `/upload` upload form for the evidence pipeline
- `/evidence/[id]` evidence detail page
- `/verify/[id]` integrity verification page
- `/quarantine` restricted to `admin` and `investigator`
- `/audit` restricted to `admin`, `investigator`, and `auditor`
- `/admin` restricted to `admin`

## Frontend Structure

- `pages/` route entry points
- `src/pages/` page-level UI implementations
- `src/components/` reusable UI components
- `src/services/` API clients for auth, evidence, verification, and admin actions
- `src/context/` authentication state
- `src/hooks/` custom hooks for auth and data fetching
- `src/styles/` global and layout styles
- `public/` static assets

## Backend Dependency

The frontend expects the FastAPI backend to be running and accessible through:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

If the backend is not available, protected pages will fail to load data and authentication will not work.

## Run Locally

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

Start the development server:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` starts the Next.js dev server on port `3000`
- `npm run build` creates a production build
- `npm run start` runs the production build on port `3000`
- `npm run lint` runs the Next.js linter

## UI Notes

- The app redirects `/` to `/dashboard`
- Authenticated users see the shared app shell with the top bar and sidebar
- JWT tokens are added to API requests through the Axios client
- A `401` response clears local auth state and redirects the user back to `/login`

## Related Files

- Root project overview: `../README.md`
- Frontend package config: `package.json`
- API base client: `src/services/api.js`
