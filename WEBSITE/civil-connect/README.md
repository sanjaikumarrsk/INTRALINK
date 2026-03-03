# Civil Connect – Real-Time Civic Issue Reporting Platform

A full-stack real-time web application for reporting and managing civic issues like road damage, streetlight outages, garbage problems, and transport issues.

## Tech Stack

| Layer          | Technology                    |
|----------------|-------------------------------|
| Frontend       | React 18 (Vite)              |
| Backend        | Node.js + Express            |
| Database       | MongoDB (Mongoose)           |
| Real-time      | Socket.io                    |
| Authentication | JWT                          |
| File Upload    | Multer                       |
| Maps           | Leaflet (react-leaflet)      |
| Charts         | Chart.js (react-chartjs-2)   |

## Features

- **Issue Reporting** – Guest or authenticated users can submit civic issues with title, description, category, image upload, and auto GPS location
- **Real-Time Control Room** – Full-screen live map with color-coded markers (Red=Pending, Yellow=In Progress, Green=Solved, Purple=Escalated)
- **Role-Based Access** – Guest, User, Ward Authority, Admin, Higher Authority
- **Automatic Escalation** – Issues unresolved for 3+ days are auto-escalated with real-time notifications
- **Rewards & Leaderboard** – Points system for reporters and wards, live-updating leaderboard
- **Admin Dashboard** – Analytics, charts, user management, issue assignment
- **Dark Mode UI** – Government control room theme with animated counters and live notifications

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or update `MONGO_URI` in `backend/.env`)

### Install & Run

```bash
# From the civil-connect root directory:

# Install all dependencies
npm run install:all

# Start both backend and frontend in dev mode
npm run dev
```

Or run separately:

```bash
# Terminal 1 – Backend (port 5000)
cd backend
npm install
npm run dev

# Terminal 2 – Frontend (port 5173)
cd frontend
npm install
npm run dev
```

### Default Admin Account
- **Email:** admin@civilconnect.in
- **Password:** admin123

## Project Structure

```
civil-connect/
├── backend/
│   ├── config/         # DB connection, seed data
│   ├── controllers/    # Auth, Issue, User, Notification controllers
│   ├── jobs/           # Escalation cron job
│   ├── middleware/      # Auth, upload, error handling
│   ├── models/         # User, Issue, Notification schemas
│   ├── routes/         # API routes
│   ├── socket/         # Socket.io setup
│   ├── uploads/        # Uploaded images
│   └── server.js       # Entry point
├── frontend/
│   └── src/
│       ├── components/ # Sidebar, TopBar, StatCard, IssueMap, IssueTable, ProtectedRoute
│       ├── context/    # AuthContext
│       ├── hooks/      # useSocket, useAnimatedCounter
│       ├── pages/      # Dashboard, ReportIssue, ControlRoom, IssueList, IssueDetail, Analytics, Leaderboard, UserManagement, Login, Register
│       ├── services/   # API client, Socket service
│       ├── App.jsx     # Router
│       └── main.jsx    # Entry point
└── package.json        # Root scripts
```

## API Endpoints

| Method | Endpoint                          | Auth       | Description              |
|--------|-----------------------------------|------------|--------------------------|
| POST   | `/api/auth/register`              | Public     | Register user            |
| POST   | `/api/auth/login`                 | Public     | Login                    |
| GET    | `/api/auth/me`                    | Protected  | Get current user         |
| POST   | `/api/issues`                     | Optional   | Create issue             |
| GET    | `/api/issues`                     | Optional   | List issues              |
| GET    | `/api/issues/analytics`           | Admin+     | Get analytics            |
| GET    | `/api/issues/:id`                 | Optional   | Get single issue         |
| PATCH  | `/api/issues/:id/status`          | Authority+ | Update status            |
| PATCH  | `/api/issues/:id/assign`          | Admin+     | Assign authority         |
| POST   | `/api/issues/:id/notes`           | Authority+ | Add progress note        |
| PATCH  | `/api/issues/:id/solution-image`  | Authority+ | Upload solution image    |
| DELETE | `/api/issues/:id`                 | Admin      | Delete issue             |
| GET    | `/api/users`                      | Admin+     | List users               |
| PATCH  | `/api/users/:id/role`             | Admin      | Update user role/ward    |
| GET    | `/api/users/leaderboard/users`    | Public     | User leaderboard         |
| GET    | `/api/users/leaderboard/wards`    | Public     | Ward leaderboard         |
| GET    | `/api/notifications`              | Protected  | Get notifications        |
| PATCH  | `/api/notifications/:id/read`     | Protected  | Mark notification read   |
| PATCH  | `/api/notifications/read-all`     | Protected  | Mark all read            |

## Socket.io Events

| Event              | Direction      | Description                     |
|--------------------|----------------|---------------------------------|
| `issue:new`        | Server→Client  | New issue created               |
| `issue:updated`    | Server→Client  | Issue status/data changed       |
| `issue:deleted`    | Server→Client  | Issue removed                   |
| `notification:new` | Server→Client  | New notification for user       |

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/civil-connect
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
