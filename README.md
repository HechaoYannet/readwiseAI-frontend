# ReadWise AI Frontend

ReadWise AI is an English reading training platform for high school students.

Implemented pages in this scaffold:

- `/` Home page with training mode cards, recommendation panel, and recent records
- `/read/[id]` Reading + quiz workspace with responsive two-column layout
- `/dashboard` Battle power overview (placeholder for chart integration)
- `/review` Daily review card flow (placeholder interaction)
- `/settings` Basic profile and reminder settings

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## UI and Structure

- `src/components/ui`: reusable shadcn-style primitives (`Button`, `Card`, `Progress`, `Skeleton`)
- `src/components/home`: homepage feature blocks
- `src/types`: shared TypeScript interfaces for page-level data models

## Notes

- This project targets Next.js 16 App Router conventions.
- Dynamic route props follow the Promise-based `params` API in `app/read/[id]/page.tsx`.
