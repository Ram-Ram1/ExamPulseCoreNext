# ExamPulseCoreNext

A polished Next.js MVP for tracking upcoming assessments, countdown deadlines, and study tasks.

## Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma schema included for future PostgreSQL persistence
- Mock API routes for demo data

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open http://localhost:3000

## Project structure

- `app/page.tsx` — dashboard UI
- `app/api/assessments/route.ts` — assessments API route
- `app/api/tasks/route.ts` — task data endpoint
- `lib/mock-data.ts` — sample assessments and task data
- `prisma/schema.prisma` — database schema foundation

## Notes

This version is intentionally built as a full Next.js app shell with a ready-to-extend data model. The mock API is included so the app works immediately without backend setup, and the Prisma schema is ready for a PostgreSQL database when you add `DATABASE_URL`.
