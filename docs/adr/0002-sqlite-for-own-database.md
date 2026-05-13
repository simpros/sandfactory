# SQLite for sandfactory's own database

Sandfactory uses SQLite instead of Postgres for its own persistent state (projects, agent runs, previews, settings). The project template came with a Postgres setup, but sandfactory is a single-user, single-server application where Postgres's concurrency and replication features aren't needed. SQLite eliminates the operational overhead of running a separate database process for sandfactory itself. Drizzle ORM supports both dialects, so the application code structure remains the same.

## Considered Options

- **Postgres** -- already scaffolded in the template. Rejected because it adds an unnecessary dependency for a single-user tool. The shared Postgres managed by sandfactory is for preview services, not for sandfactory's own state.

## Consequences

- The `packages/db` package must be reconfigured from the Postgres dialect to the SQLite dialect in Drizzle.
- The existing `docker-compose.yml` Postgres service is only needed for preview deployments (as a shared service), not for sandfactory itself.
- The SQLite database file lives on a persistent volume (e.g., `/data/sandfactory.db` in the Docker deployment).
