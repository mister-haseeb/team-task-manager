# Team Task Manager

A REST API for managing teams and their tasks. Users can create teams, invite members, and create, assign and track tasks by status and priority.

> **Status:** in development. The Express server and PostgreSQL schema are set up; authentication, team and task endpoints are in progress.

## Tech stack

- **Runtime:** Node.js 20+
- **Framework:** Express 5
- **Database:** PostgreSQL (via `pg`)
- **Auth:** Passport (local strategy) with `express-session`, sessions stored in Postgres (`connect-pg-simple`), passwords hashed with `bcrypt`
- **Validation & security:** Joi, Helmet, CORS, express-rate-limit, xss

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- [PostgreSQL](https://www.postgresql.org/download/) running locally

### 1. Clone and install

```bash
git clone https://github.com/mister-haseeb/team-task-manager.git
cd team-task-manager/server
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

| Variable       | Description                                  | Example                                                          |
| -------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| `PORT`         | Port the API listens on                      | `5000`                                                           |
| `NODE_ENV`     | `development` or `production`                | `development`                                                    |
| `JWT_SECRET`   | Secret used to sign tokens                   | any long random string                                           |
| `DATABASE_URL` | PostgreSQL connection string                 | `postgresql://postgres:password@localhost:5432/team_task_manager` |

Special characters in the database password must be URL-encoded (e.g. `@` → `%40`).

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE team_task_manager;"
```

### 4. Run migrations

```bash
npm run migrate
```

This runs every `.sql` file in `server/migrations/` once, in filename order, and records it in the `schema_migrations` table. Running it again skips migrations that have already been applied.

### 5. Start the server

```bash
npm run dev     # development, restarts on file changes
npm start       # production
```

Check it's running:

```bash
curl http://localhost:5000/api/health
# {"status":"ok"}
```

## Scripts

All scripts run from the `server/` folder.

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the server with nodemon            |
| `npm start`       | Start the server                         |
| `npm run migrate` | Apply pending database migrations        |

## Database schema

| Table          | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `users`        | Registered users (name, email, password hash)                  |
| `teams`        | Teams, each with an owner                                      |
| `team_members` | Which users belong to which team, with role `owner`/`member`  |
| `tasks`        | Tasks within a team: status, priority, due date, assignee      |
| `invites`      | Pending/accepted email invitations to join a team              |
| `session`      | Login sessions (used by `connect-pg-simple`)                   |

Task `status` is one of `todo`, `in_progress`, `done`; `priority` is one of `low`, `medium`, `high`.

## Project structure

```
team-task-manager/
└── server/
    ├── migrations/          # SQL migration files (001_init.sql, ...)
    ├── scripts/
    │   └── migrate.js       # Migration runner
    └── src/
        ├── app.js           # Express app setup
        ├── server.js        # Entry point, starts the HTTP server
        ├── config/          # Database connection pool
        ├── controllers/     # Request handlers
        ├── middleware/      # Error handler and other middleware
        ├── routes/          # Route definitions
        ├── services/        # Business logic and database queries
        ├── utils/           # Shared helpers
        └── validators/      # Joi request schemas
```

## Contributing

Work happens on feature branches created from `develop`:

```bash
git checkout develop
git pull
git checkout -b feature/<name>
# ...commit your work...
git push -u origin feature/<name>
```

Then open a pull request into `develop`. `main` holds released versions.

Never commit `.env` files. Add new variables to `.env.example` instead.
