# Team Task Manager

A web app for small teams to organise their work. Users register, create teams, add members, and create, assign and track tasks, then filter them by team, assignee, status or priority.

**Live demo:** _add the Cloud Run URL here after deploying_

## Features

- Secure registration and login (Passport + sessions, bcrypt-hashed passwords)
- Create, rename and delete teams; add members by email or remove them
- Create, assign, update and delete tasks with status, priority and due date
- Dashboard with team list, task list, search and filters (team, assignee, status, priority)
- Task form in a modal for creating and editing
- Responsive layout for phones, tablets and desktops

**Bonus features**

- **Role-based access:** only a team's owner can edit or delete it and manage its members; only a task's creator or the team owner can delete a task
- **Email invites (stubbed):** owners invite people by email; the "email" is logged by the server, and the invitee sees the invite on their dashboard after logging in with that address
- **Due-date reminders:** after login, users see their unfinished tasks that are overdue or due within 3 days

## Tech stack

| Layer    | Technology                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router                                   |
| Backend  | Node.js, Express 5, Joi validation                                              |
| Auth     | Passport (local strategy), express-session, HTTP-only cookies, bcrypt           |
| Sessions | PostgreSQL via `connect-pg-simple`, in-memory fallback for development          |
| Database | PostgreSQL (Cloud SQL on Google Cloud)                                          |
| Hosting  | Google Cloud Run (one container: Express serves the API and the React build)    |

## How it fits together

```
Browser ──► Cloud Run (Express)
              ├── /api/*   REST API ──► Cloud SQL (PostgreSQL)
              └── /*       React app (client/dist)
```

The React app and the API are served from the same origin, so the session cookie can stay `HttpOnly`, `SameSite=Lax` and `Secure` without any CORS setup. In development, the Vite dev server proxies `/api` to Express to get the same behaviour.

## Running locally

### Prerequisites

- Node.js 20 or newer
- PostgreSQL 14 or newer, either installed locally or started with `docker compose up -d` (see [docker-compose.yml](docker-compose.yml))

### 1. Install

```bash
git clone https://github.com/mister-haseeb/team-task-manager.git
cd team-task-manager
npm run install:all
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Then edit `server/.env`:

| Variable         | Description                                                                  | Example                                                           |
| ---------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `PORT`           | Port for the API                                                             | `5050`                                                            |
| `NODE_ENV`       | `development` or `production`                                                | `development`                                                     |
| `SESSION_SECRET` | Long random string used to sign the session cookie (required in production)  | output of `openssl rand -hex 32`                                  |
| `SESSION_STORE`  | `postgres` or `memory` (default: `postgres` in production, `memory` in dev)  | `postgres`                                                        |
| `DATABASE_URL`   | PostgreSQL connection string                                                 | `postgresql://postgres:password@localhost:5432/team_task_manager` |
| `APP_URL`        | Public URL of the app, used in invite links                                  | `http://localhost:5173`                                           |

Special characters in the database password must be URL-encoded (for example `@` becomes `%40`).

### 3. Create the database and tables

```bash
psql -U postgres -c "CREATE DATABASE team_task_manager;"   # skip if using docker compose
npm run migrate
```

`npm run migrate` applies each file in `server/migrations/` once, in order, and records it in `schema_migrations`.

### 4. Start the app

In two terminals:

```bash
npm run dev:server   # API on http://localhost:5050
npm run dev:client   # React app on http://localhost:5173
```

Open http://localhost:5173 and create an account. If the API runs on another port, start the client with `API_URL=http://localhost:<port> npm run dev:client`.

## Scripts

Run these from the repository root:

| Command               | Description                                         |
| --------------------- | --------------------------------------------------- |
| `npm run install:all` | Install server and client dependencies              |
| `npm run migrate`     | Apply pending database migrations                   |
| `npm run dev:server`  | Start the API with auto-reload                      |
| `npm run dev:client`  | Start the Vite dev server                           |
| `npm run build`       | Build the React app into `client/dist`              |
| `npm start`           | Start the API (serves `client/dist` if it exists)   |
| `npm test`            | Run the API test suite                              |

## Tests

The API is covered by integration tests (Jest + Supertest) in [server/tests](server/tests): auth and sessions, team and task CRUD, filters and search, role-based access, invites and reminders. They run against a real PostgreSQL database named after yours with a `_test` suffix (for example `team_task_manager_test`), which is created and migrated automatically and emptied before each test. Set `TEST_DATABASE_URL` to use a different one.

```bash
npm test
```

## CI/CD

GitHub Actions runs two workflows from [.github/workflows](.github/workflows):

- **CI** ([ci.yml](.github/workflows/ci.yml)) runs on every pull request and on pushes to `develop` and `main`. It runs the API tests against a PostgreSQL service container and lints and builds the client.
- **Deploy** ([deploy.yml](.github/workflows/deploy.yml)) runs when `main` is updated: it runs CI again, then builds and deploys the app to Cloud Run. GitHub signs in to Google with Workload Identity Federation, so no service-account key is stored in GitHub. The job is skipped until the variables below are set.

To enable deployments, first follow [Deploying to Google Cloud](#deploying-to-google-cloud) once, then:

```bash
PROJECT_ID=your-project-id
REPO=mister-haseeb/team-task-manager
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SA=github-deployer@$PROJECT_ID.iam.gserviceaccount.com

# A service account that GitHub Actions deploys as
gcloud iam service-accounts create github-deployer --display-name "GitHub Actions deployer"
for role in roles/run.admin roles/iam.serviceAccountUser roles/cloudbuild.builds.editor \
            roles/artifactregistry.admin roles/storage.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA" --role="$role"
done

# Trust GitHub's identity tokens, but only for this repository
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers create-oidc github-repo --location=global \
  --workload-identity-pool=github --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$REPO'"
gcloud iam service-accounts add-iam-policy-binding $SA --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"

# Tell the workflow where to deploy (repository variables, not secrets: none of these are sensitive)
gh variable set GCP_PROJECT_ID --body "$PROJECT_ID"
gh variable set GCP_REGION --body us-central1
gh variable set GCP_CLOUD_SQL_INSTANCE --body "$PROJECT_ID:us-central1:ttm-db"
gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --body "$SA"
gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER \
  --body "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-repo"
```

After that, every merge into `main` deploys automatically. You can also start a deployment from the **Actions** tab with **Run workflow**.

## API reference

Every route except `/api/health` and `/api/auth/register|login` requires a logged-in session. Errors always have the shape `{ "error": "message" }`.

### Auth

| Method | Route                | Body                        | Description              |
| ------ | -------------------- | --------------------------- | ------------------------ |
| POST   | `/api/auth/register` | `{ name, email, password }` | Create account, log in   |
| POST   | `/api/auth/login`    | `{ email, password }`       | Log in                   |
| POST   | `/api/auth/logout`   | none                        | End the session          |
| GET    | `/api/auth/me`       | none                        | Current user             |

### Teams

| Method | Route                                 | Who            | Description                                |
| ------ | ------------------------------------- | -------------- | ------------------------------------------ |
| GET    | `/api/teams`                          | any user       | My teams, with my role and member count    |
| POST   | `/api/teams`                          | any user       | Create a team (creator becomes owner)      |
| GET    | `/api/teams/:teamId`                  | member         | Team with its members                      |
| PUT    | `/api/teams/:teamId`                  | owner          | Update name/description                    |
| DELETE | `/api/teams/:teamId`                  | owner          | Delete team, its tasks and invites         |
| GET    | `/api/teams/:teamId/members`          | member         | List members                               |
| POST   | `/api/teams/:teamId/members`          | owner          | Add an existing user `{ email }`           |
| DELETE | `/api/teams/:teamId/members/:userId`  | owner / self   | Remove a member, or leave the team         |
| GET    | `/api/teams/:teamId/invites`          | owner          | Pending invites                            |
| POST   | `/api/teams/:teamId/invites`          | owner          | Invite by email `{ email }`                |
| DELETE | `/api/teams/:teamId/invites/:inviteId`| owner          | Cancel an invite                           |

### Tasks

| Method | Route                  | Who                     | Description                                                                 |
| ------ | ---------------------- | ----------------------- | --------------------------------------------------------------------------- |
| GET    | `/api/tasks`           | member                  | List tasks; query: `teamId`, `assigneeId`, `status`, `priority`, `search`   |
| POST   | `/api/tasks`           | member of `teamId`      | Create `{ teamId, title, description?, status?, priority?, dueDate?, assigneeId? }` |
| GET    | `/api/tasks/reminders` | any user                | My unfinished tasks that are overdue or due within 3 days                   |
| GET    | `/api/tasks/:taskId`   | member                  | One task                                                                    |
| PATCH  | `/api/tasks/:taskId`   | member                  | Update any of the fields above (not `teamId`)                               |
| DELETE | `/api/tasks/:taskId`   | creator / team owner    | Delete a task                                                               |

`status` is `todo`, `in_progress` or `done`; `priority` is `low`, `medium` or `high`; `dueDate` is `YYYY-MM-DD`. The assignee must be a member of the task's team.

### Invites (for the invitee)

| Method | Route                          | Description                                  |
| ------ | ------------------------------ | -------------------------------------------- |
| GET    | `/api/invites`                 | Pending invites sent to my email             |
| POST   | `/api/invites/:token/accept`   | Join the team                                |
| POST   | `/api/invites/:token/decline`  | Decline                                      |

## Security

- Passwords are hashed with bcrypt (12 rounds) and never returned by the API.
- The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production. Sessions are stored in PostgreSQL.
- `requireAuth` protects every non-auth route; `teamAccess` enforces team membership and owner-only actions. A non-member asking for a team gets 404, so team ids can't be probed.
- Every request body, query and route param is validated with Joi; unknown fields are stripped and HTML is removed from text input (`xss`).
- All SQL uses parameterised queries; search input escapes `LIKE` wildcards.
- Login and register are rate limited (20 attempts per 15 minutes per IP); Helmet sets the security headers.

## Project structure

```
team-task-manager/
├── client/                    React app (Vite)
│   └── src/
│       ├── api/               fetch wrapper + one module per resource
│       ├── components/        ui/, layout/, routes/, teams/, tasks/, dashboard/
│       ├── context/           AuthProvider (current user)
│       ├── hooks/             useAuth, useTeams, useTasks, ...
│       ├── pages/             Login, Register, Dashboard
│       └── utils/             task labels and date helpers
├── server/                    Express API
│   ├── migrations/            SQL migrations (001_init.sql, ...)
│   ├── scripts/migrate.js     migration runner
│   └── src/
│       ├── config/            db pool, session store, passport
│       ├── routes/            URL → middleware → controller
│       ├── controllers/       HTTP layer (read request, send response)
│       ├── services/          business rules and SQL
│       ├── middleware/        requireAuth, teamAccess, validate, errorHandler
│       └── validators/        Joi schemas
├── Dockerfile                 production image (client build + API)
└── docker-compose.yml         optional local PostgreSQL
```

## Deploying to Google Cloud

The app runs on **Cloud Run** with a **Cloud SQL for PostgreSQL** database. You'll need the [gcloud CLI](https://cloud.google.com/sdk/docs/install) and a project with billing enabled. Replace `PROJECT_ID`, the region and the password below with your own.

```bash
gcloud auth login
gcloud config set project PROJECT_ID
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com
```

**1. Create the database**

```bash
gcloud sql instances create ttm-db --database-version=POSTGRES_16 --edition=ENTERPRISE \
  --tier=db-f1-micro --region=us-central1
gcloud sql databases create team_task_manager --instance=ttm-db
gcloud sql users create ttm_app --instance=ttm-db --password=CHOOSE_A_STRONG_PASSWORD
```

**2. Store the secrets**

Cloud Run connects to Cloud SQL through a Unix socket under `/cloudsql/`:

```bash
printf 'postgresql://ttm_app:CHOOSE_A_STRONG_PASSWORD@/team_task_manager?host=/cloudsql/PROJECT_ID:us-central1:ttm-db' \
  | gcloud secrets create DATABASE_URL --data-file=-
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create SESSION_SECRET --data-file=-

# Let Cloud Run's service account read the secrets and connect to Cloud SQL
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format='value(projectNumber)')
for role in roles/secretmanager.secretAccessor roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role="$role"
done
```

**3. Deploy**

```bash
gcloud run deploy team-task-manager --source . --region us-central1 --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:us-central1:ttm-db \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest \
  --set-env-vars NODE_ENV=production
```

Cloud Build builds the [Dockerfile](Dockerfile), and the container applies any pending migrations before it starts. When the deploy finishes, set `APP_URL` so invite links point at the live site:

```bash
gcloud run services update team-task-manager --region us-central1 \
  --update-env-vars APP_URL=https://YOUR-SERVICE-URL.run.app
```

## Development workflow

Work happens on feature branches created from `develop` and merged through pull requests; `main` holds the released version.

```bash
git checkout develop && git pull
git checkout -b feature/<name>
# commit, push, open a PR into develop
```

Never commit `.env` files. Add new variables to `server/.env.example` instead.
