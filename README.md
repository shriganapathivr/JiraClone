# ZiraClone

A beautiful, full-stack **Jira clone** for project management and issue tracking — built on the **MERN** stack (MongoDB, Express, React, Node) with a heavy emphasis on polished UI and smooth animations.

![stack](https://img.shields.io/badge/stack-MERN-5b3df5) ![license](https://img.shields.io/badge/license-MIT-36b37e)

## ✨ Features

- **Authentication & roles** — JWT auth (HTTP-only cookie + token fallback), bcrypt-hashed passwords, auto-generated DiceBear avatars. Two roles: **admin (project head)** and **member**.
- **Profile management** — every user can edit their username and upload a profile picture (cropped + compressed client-side to a small thumbnail) or reset back to auto-generated initials, from the top-bar avatar menu.
- **Real-time chat** — members can message the project head (and vice-versa) in real time over **Socket.io**, with live delivery, online presence dots, typing indicators, and unread badges — no page refresh.
- **Projects** — create / edit / delete projects with a name, key (e.g. `ZIRA`), description, and members. Issues auto-number per project (`ZIRA-1`, `ZIRA-2`, …).
- **Issues** — title, markdown description, type (Story / Task / Bug / Epic), status, priority, assignee, reporter, story points, labels, and a comment thread.
- **Kanban board** — columns by status with fluid `@dnd-kit` drag-and-drop. Cards animate on drag, drop, and reorder; status & order persist to the backend.
- **Backlog** — prioritized, drag-to-reorder list; move issues in and out of sprints.
- **Sprints** — create, start, and complete sprints with animated progress bars. The active sprint feeds the board.
- **Issue detail panel** — animated slide-in side panel with inline editing and a live comment thread.
- **Search & filter** — by text, assignee, type, status, and priority.
- **Dashboard** — animated Recharts visualizations (issues by status, priority, and assignee).
- **Design** — distinctive Space Grotesk + Plus Jakarta Sans typography, an electric-violet palette, light/dark mode with an animated toggle, and Framer Motion animations throughout (page reveals, route transitions, modals, toasts, skeleton loaders, empty states).

## 🧱 Tech

**Frontend:** React + Vite, React Router, Tailwind CSS, Zustand, Framer Motion, @dnd-kit, Recharts, Axios, lucide-react, socket.io-client.
**Backend:** Node + Express, Mongoose, JWT, bcryptjs, express-validator, Socket.io.

## 📋 Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally (the project is configured for a local instance via MongoDB Compass — no auth).

## 🚀 Getting started

### 1. Install dependencies

From the project root:

```bash
npm run install:all
```

This installs the root, `server/`, and `client/` dependencies. (Or run `npm install` in each folder manually.)

### 2. Environment variables

`server/.env` is already created with sensible local defaults (and `server/.env.example` documents them):

```env
MONGODB_URI=mongodb://localhost:27017/ziraclone
PORT=5000
JWT_SECRET=change_this_to_a_long_random_string
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Mongoose connects to this URI on start and **auto-creates the `ziraclone` database and its collections** — no manual DB setup needed. Just make sure MongoDB is running.

> Change `JWT_SECRET` to a long random string before deploying.

### 3. Seed demo data

```bash
npm run seed
```

This creates 3 users, the **ZiraClone Demo** project (key `ZIRA`), ~16 issues across every status/type/priority, and one **active sprint**.

**Logins:**

| Role | Email | Password | Can do |
| --- | --- | --- | --- |
| **Admin (project head)** | `admin@gmail.com` | `Shri@2006` | Everything — create/edit/delete projects, issues & sprints; assign work to anyone; chat with any member. |
| Member | `alice@zira.dev` | `password123` | Move their cards across the board (change status), comment, and chat with the project head. Cannot create or assign work. |
| Member | `bob@zira.dev` | `password123` | (same as above) |
| Member | `carol@zira.dev` | `password123` | (same as above) |

## 🔐 Roles & permissions

ZiraClone has a simple two-tier model:

- **Admin / project head** (`admin@gmail.com`) — full control. Creates and edits projects, issues, and sprints; assigns issues to any user; can chat with everyone. Sees **all** projects and **all** users (including newly registered ones, so they can be assigned work immediately — assigning a user automatically adds them to the project).
- **Members** — work-focused. They can move their cards across the Kanban board (status changes), reorder, comment, and chat with the project head. They **cannot** create/assign/delete issues, create projects, or manage sprints. The UI hides those controls and the API enforces it (returns `403`).

### 4. Run in development

```bash
npm run dev
```

This runs the Express API (`http://localhost:5000`) and the Vite dev server (`http://localhost:5173`) concurrently. Vite proxies `/api` to Express, so open **http://localhost:5173**.

## 🏗️ Production build & run

The whole app deploys as a **single Node service**: Express serves the built React client.

```bash
npm run build                 # builds client → client/dist
NODE_ENV=production npm start  # Express serves the API + the built client on PORT
```

On Windows PowerShell:

```powershell
npm run build
$env:NODE_ENV="production"; npm start
```

Then open **http://localhost:5000**. Express serves `client/dist` and falls back to `index.html` for client-side routing.

## ☁️ Deploying with MongoDB Atlas

The code is identical for production — just swap the connection string. In your hosting environment set:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ziraclone?retryWrites=true&w=majority
NODE_ENV=production
JWT_SECRET=<a long random string>
```

No code changes are required; Mongoose connects to Atlas exactly as it does locally.

## 📜 Scripts (root)

| Script | Description |
| --- | --- |
| `npm run dev` | Run client + server together (development). |
| `npm run build` | Install client deps and build the React app. |
| `npm start` | Run the production server (serves the built client). |
| `npm run seed` | Seed the database with demo data. |
| `npm run install:all` | Install dependencies for root, server, and client. |

## 🗂️ Project structure

```
ZIRAclone/
├── package.json          # root scripts (dev / build / start / seed)
├── server/
│   ├── .env / .env.example
│   └── src/
│       ├── index.js      # entry — connects DB, starts server
│       ├── app.js        # Express app + static serving in prod
│       ├── config/       # env + db connection
│       ├── models/       # User, Project, Issue, Sprint, Comment
│       ├── controllers/  # route handlers
│       ├── routes/       # /api/auth, /projects, /issues, /sprints, /comments, /users
│       ├── middleware/   # auth, validation, centralized error handling
│       ├── utils/        # token, ApiError, asyncHandler
│       └── seed.js       # demo data seeder
└── client/
    ├── index.html        # Google Fonts (Space Grotesk / Plus Jakarta Sans)
    └── src/
        ├── main.jsx / App.jsx        # router + route transitions
        ├── lib/          # axios instance, constants, formatters
        ├── store/        # Zustand stores (auth, theme, toasts, project data)
        ├── hooks/        # useProjectData
        ├── components/   # layout, ui primitives, board, backlog, issues
        └── pages/        # Login, Register, Projects, Board, Backlog, Sprints, Dashboard, Settings
```

## 🔌 API overview

All routes are under `/api` and (except auth) require a valid JWT.

- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `PUT /api/auth/me` (update username/avatar)
- `GET/POST /api/projects` · `GET/PUT/DELETE /api/projects/:id`
- `GET/POST /api/issues` · `GET/PUT/DELETE /api/issues/:id` · `PATCH /api/issues/reorder`
- `GET/POST /api/sprints` · `PUT/DELETE /api/sprints/:id` · `POST /api/sprints/:id/start` · `POST /api/sprints/:id/complete`
- `GET/POST /api/comments` · `DELETE /api/comments/:id`
- `GET /api/users`
- `GET /api/messages/contacts` · `GET /api/messages/:userId` · `POST /api/messages` · `GET /api/messages/unread/count`

**Real-time (Socket.io):** authenticates via the JWT on the handshake, then emits/listens for `message:send` / `message:new`, `typing`, `message:read`, and `presence:update`. In dev, Vite proxies `/socket.io` to the API server; in production it's same-origin.

## License

MIT — build on it freely.
