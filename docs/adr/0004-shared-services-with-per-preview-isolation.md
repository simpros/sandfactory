# Shared service instances with per-preview isolation

Database services (Postgres, MySQL, etc.) default to a "shared" mode where a single container runs persistently and sandfactory creates an isolated resource (e.g., a new database) within it for each preview. This avoids spinning up a separate database container per preview, saving significant CPU and RAM on the dev-server. Built-in service adapters handle the create/destroy lifecycle for common services (Postgres `CREATE DATABASE` / `DROP DATABASE`, etc.), with user-defined hook overrides for custom behavior. Services can also be configured as "dedicated" when full container isolation is needed.

## Considered Options

- **Dedicated container per preview for all services** -- simpler model but wasteful. A dev-server with 10 active previews would run 10 Postgres containers instead of 1. Rejected for resource reasons.
- **Only shared, no dedicated option** -- too restrictive. Some services (message queues, custom services) may need true isolation. Rejected.

## Consequences

- Sandfactory manages the lifecycle of shared service containers (starting them on first use, keeping them running).
- Service adapters must handle database naming conventions (e.g., `preview_{project}_{branch_slug}`) and cleanup on preview teardown.
- The `.sandfactory/config.yaml` service definitions include a `mode: shared | dedicated` field, defaulting to `shared` for database types.
