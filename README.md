# Arij

Arij is a lightweight project tracker for organizing work in projects, tracking tickets, and managing workflow boards. It runs as a self-hosted web app and stores its data in SQLite.

## Features

- Create and manage projects with unique project prefixes.
- Track epics, stories, tasks, and bugs using project-scoped ticket keys (for example, `ARJ-1`).
- Organize tickets with statuses, descriptions, estimates, reporters, assignees, and parent-child relationships.
- Manage project collaborators and custom statuses.
- Create boards with configurable workflow stages and move tickets through them.
- Persist data locally in SQLite.

## Tech stack

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19 and [TypeScript](https://www.typescriptlang.org/)
- [SQLite](https://sqlite.org/) via `better-sqlite3`
- [Zod](https://zod.dev/) for input validation
- [dnd-kit](https://dndkit.com/) for drag-and-drop interactions

## Requirements

- Node.js 22 or later
- npm

For Docker deployment, Docker Engine and the Docker Compose plugin are required.

## Getting started

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The SQLite database is created automatically at `data/arij.db` by default; the containing directory is created if needed.

## Configuration

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_PATH` | Path to the SQLite database file | `data/arij.db` under the application working directory |
| `PORT` | Port used by the production server | `3000` |
| `HOSTNAME` | Host interface used by the production server | Next.js default; Docker sets it to `0.0.0.0` |

Set `DATABASE_PATH` to keep the database outside the project directory or to use a mounted persistent volume. Back up the database file regularly if it contains data you need to retain.

## Docker

Build and start the application with Docker Compose:

```sh
docker compose up --build
```

The app is available at [http://localhost:3000](http://localhost:3000). Compose mounts a named volume at `/data`, and the container stores the database at `/data/arij.db`, so data persists across container restarts.

To stop the app:

```sh
docker compose down
```

The named volume is retained when the containers are removed. To also delete the stored database, remove the volume explicitly:

```sh
docker compose down --volumes
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server (run `npm run build` first) |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |

## Data and deployment notes

The application uses SQLite, so a single persistent database file holds project, ticket, collaborator, status, board, and workflow-stage data. When deploying with Docker, keep the `/data` volume mounted to preserve this data. The provided Compose configuration publishes the app on port `3000`.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
