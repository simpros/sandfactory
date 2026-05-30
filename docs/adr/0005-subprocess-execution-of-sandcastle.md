# Subprocess execution of sandcastle scripts

Sandfactory triggers agent runs by executing each project's `.sandcastle/main.ts` as a subprocess (`npx tsx .sandcastle/main.ts`), rather than importing and calling sandcastle's TypeScript API directly. Parameters are passed via `SANDFACTORY_`-prefixed environment variables. The command to execute is declared in the project's `.sandcastle/config.yaml` under `agent.command`. This keeps each project in full control of its own orchestration logic (which template, which review steps, which model) while sandfactory monitors the subprocess output and git state for results.

## Considered Options

- **Call sandcastle's TypeScript API directly** -- sandfactory would import `@ai-hero/sandcastle` and call `run()` programmatically. Rejected because it would require sandfactory to replicate each project's orchestration logic (parallel-planner, sequential-reviewer, custom review steps, etc.).
- **Sandfactory-owned run configuration via UI** -- all agent run settings configured through the web interface. Rejected for the same reason: it shifts orchestration ownership away from the project where it belongs.

## Consequences

- Each project must have a `.sandcastle/main.ts` (or equivalent) that reads `SANDFACTORY_*` env vars when present and falls back to defaults otherwise.
- Sandfactory's visibility into a run is limited to subprocess stdout/stderr and git state (branches, commits). It cannot introspect sandcastle's internal state.
- Projects remain independently usable via CLI without sandfactory.
