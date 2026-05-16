# Team Task Manager

Production-style full-stack Team Task Manager for the company assignment brief. It is a simplified Trello/Asana workspace where users create projects, invite members, assign tasks, update progress, and view dashboard analytics.

## Project Architecture

The repository is a two-app monorepo:

- `apps/backend`: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt.
- `apps/frontend`: Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI components, Axios, React Query.

Authentication uses signed JWTs stored in an HTTP-only cookie. The API also accepts a Bearer token for API testing. Roles are scoped per project through `ProjectMember.role`, which keeps the system flexible: one user can be an Admin in one project and a Member in another.

## Folder Structure

```txt
team-task-manager/
  apps/
    backend/
      prisma/
        schema.prisma
        seed.ts
      src/
        config/
        middleware/
        modules/
          auth/
          dashboard/
          projects/
          shared/
          tasks/
        utils/
        app.ts
        index.ts
        routes.ts
    frontend/
      src/
        app/
          (auth)/
          (dashboard)/
        components/
          layout/
          ui/
        features/
          auth/
          projects/
        lib/
```

## Database Schema

Core models:

- `User`: registered users with hashed passwords.
- `Project`: workspace/project container.
- `ProjectMember`: many-to-many join between users and projects, with `ADMIN` or `MEMBER` role.
- `Task`: belongs to a project and can be assigned to a user.
- `Activity`: recent audit feed for project actions.

Task enums:

- Priority: `LOW`, `MEDIUM`, `HIGH`
- Status: `TODO`, `IN_PROGRESS`, `DONE`

## API Plan

All protected routes require the JWT cookie or `Authorization: Bearer <token>`.

```txt
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/projects
POST   /api/projects
GET    /api/projects/:projectId
POST   /api/projects/:projectId/members
DELETE /api/projects/:projectId/members/:userId

GET    /api/projects/:projectId/tasks?status=TODO&priority=HIGH
POST   /api/projects/:projectId/tasks
PATCH  /api/projects/:projectId/tasks/:taskId
PATCH  /api/projects/:projectId/tasks/:taskId/status
DELETE /api/projects/:projectId/tasks/:taskId

GET    /api/dashboard/projects/:projectId
GET    /api/health
```

## Frontend Pages

- `/signup`: account creation with validation.
- `/login`: secure login.
- `/dashboard`: project list, empty state, project creation.
- `/projects/[projectId]`: analytics, task board, filters, member management, activity feed.

Admins can create projects, add/remove members, create/edit/delete tasks, assign users, and view all project tasks. Members can view their project and update the status of tasks assigned to them.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

3. Start PostgreSQL locally and set `DATABASE_URL`.

4. Run Prisma:

```bash
npm run db:generate
npm run db:migrate
npm run seed --workspace apps/backend
```

5. Run both apps:

```bash
npm run dev --workspace apps/backend
npm run dev --workspace apps/frontend
```

Backend: `http://localhost:4000`  
Frontend: `http://localhost:3000`

Seed users:

- `admin@example.com` / `Password123!`
- `member@example.com` / `Password123!`

## Railway Deployment Guide

Create three Railway services:

1. PostgreSQL database service.
2. Backend service from this repo with root directory `apps/backend`.
3. Frontend service from this repo with root directory `apps/frontend`.

Backend environment variables:

```txt
DATABASE_URL=<Railway PostgreSQL URL>
JWT_SECRET=<long random secret>
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend.up.railway.app
COOKIE_NAME=ttm_token
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

Frontend environment variables:

```txt
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

Backend build command:

```bash
npm install && npm run build && npm run prisma:deploy
```

Backend start command:

```bash
npm run start
```

Frontend build command:

```bash
npm install && npm run build
```

Frontend start command:

```bash
npm run start
```

After deployment, verify `/api/health` on the backend and then sign up from the frontend URL.

## API Testing Guide

Signup:

```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Taylor Admin\",\"email\":\"taylor@example.com\",\"password\":\"Password123!\"}"
```

Login and copy the returned token:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"taylor@example.com\",\"password\":\"Password123!\"}"
```

Create project:

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d "{\"name\":\"Client Portal\",\"description\":\"Demo assignment project\"}"
```

Create task:

```bash
curl -X POST http://localhost:4000/api/projects/<projectId>/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d "{\"title\":\"Build dashboard\",\"priority\":\"HIGH\",\"status\":\"TODO\"}"
```

Update task status:

```bash
curl -X PATCH http://localhost:4000/api/projects/<projectId>/tasks/<taskId>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d "{\"status\":\"IN_PROGRESS\"}"
```

## Interview Explanation Points

- I modeled roles at the project membership level instead of globally, which matches real collaboration tools.
- Authentication uses bcrypt for hashing and JWT in an HTTP-only cookie, reducing token exposure in the browser.
- Authorization lives in backend services, so UI checks are convenience only, not security boundaries.
- Prisma relations enforce project ownership, membership, task assignment, and cascading cleanup.
- React Query handles server state, caching, invalidation, loading states, and optimistic-feeling refreshes.
- The UI separates auth, dashboard, project workspace, and reusable shadcn-style primitives for easy explanation.
- Railway deployment is split into frontend, backend, and PostgreSQL services with environment-specific URLs.

## Development Roadmap

1. Foundation: monorepo, environment variables, Prisma schema, Express app, Next app.
2. Authentication: signup, login, logout, current user, protected frontend routes.
3. Projects: create/list/detail projects, member invite and removal.
4. Tasks: CRUD, assignment, status updates, filters, overdue highlighting.
5. Dashboard: task totals, status counts, per-user load, overdue work, activity feed.
6. Polish: loading states, empty states, toasts, responsive layout, deployment docs.
