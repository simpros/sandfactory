# Sandfactory

A web application and CLI that orchestrates AI coding agent runs (via Sandcastle) across multiple projects and manages preview deployments of their branches on a shared dev-server.

## Language

### Projects and orchestration

**Project**:
A registered repository on the dev-server that sandfactory manages. Registration either points to an existing local path or provides a remote URL that sandfactory clones using the dev-server's system Git credentials (SSH keys, credential helpers). Sandfactory does not store Git credentials itself.
_Avoid_: repo, app, codebase

**Agent Run**:
A single execution of a project's sandcastle script, triggered by sandfactory with no domain-specific inputs ("fire and go"). Sandcastle autonomously determines what to work on (e.g., by reading GitHub issues). Sandfactory's visibility is limited to stdout/stderr (streamed live to the UI) and the resulting git state.
_Avoid_: job, task, build

**Dev-Server**:
The single machine where sandfactory, sandcastle, and all target project repositories are co-located.
_Avoid_: host, server, machine

### Preview deployments

**Preview**:
An isolated, temporary deployment of a project branch, consisting of the app and its services, accessible via unique short-ID URLs. The primary App gets `<short-id>.preview.example.com`; additional Apps get `<short-id>-<app-name>.preview.example.com` (dash-separated, single subdomain level, compatible with Cloudflare free tier wildcard DNS).
_Avoid_: environment, deployment, staging

**Preview Service**:
An individual service instance within a preview (the app container, a database, a cache, etc.).
_Avoid_: dependency, component

**Shared Service**:
A long-lived service container (e.g., a single Postgres instance) that provides isolated resources (databases) to multiple previews.
_Avoid_: global service, singleton

**Dedicated Service**:
A service container spun up exclusively for a single preview and destroyed with it.
_Avoid_: isolated service, per-preview service

**Service Adapter**:
Built-in logic that knows how to create and destroy isolated resources within a shared service (e.g., `CREATE DATABASE` / `DROP DATABASE` for Postgres).
_Avoid_: plugin, driver, provider

**Repo Root** (`~/projects/` by default):
A configurable global base directory on the dev-server where sandfactory clones remote repos. When registering a Project via URL, sandfactory clones to `<repo-root>/<repo-name>`. Configured once during initial setup.
_Avoid_: workspace, projects folder

**API Token**:
A single long-lived secret generated during Sandfactory setup, used by the **CLI** to authenticate against the Sandfactory API. Displayed once in Settings and regeneratable. Stored as a GitHub Actions secret on target projects to enable automated CLI calls (e.g., teardown on PR merge).
_Avoid_: password, key, secret

**CLI**:
A command-line client that communicates with the sandfactory server over HTTP using an API token. Provides the same operations as the web UI (e.g., triggering runs, tearing down previews) for use in automated contexts such as GitHub Actions. Both the web UI and CLI consume the same sandfactory API.
_Avoid_: script, tool

### Configuration

**App**:
A deployable web application declared within a Project Config, identified by a Dockerfile path (e.g., `apps/web/Dockerfile`) and an exposed port. A single Project may declare multiple Apps (e.g., in a monorepo). Every App declared in a Project Config is built and deployed as part of every Preview for that Project.
_Avoid_: service, container, target

**Project Config** (`.sandfactory/config.yaml`):
A per-repo file declaring the Apps to build (Dockerfile paths, ports) and the services to provision for each Preview. Services declare their mode (`shared` or `dedicated`), their data strategy (`fork` from a source or `seed` from a file/command), and which environment variable to inject into app containers (e.g., `inject_as: DATABASE_URL`).
_Avoid_: manifest, spec

**Sandcastle Config** (`.sandcastle/`):
A per-repo directory owned by sandcastle, defining how AI agents run (Dockerfile, prompts, hooks). Read but not managed by sandfactory.
_Avoid_: agent config

## Relationships

- A **Project** has many **Agent Runs** and many **Previews**. Only one **Agent Run** may be active at a time per **Project**; new runs are rejected while one is in progress.
- An **Agent Run** may produce zero or one **Previews** (not every run gets previewed). Previews are deployed manually by default; a Project Config flag can enable auto-deploy on run completion.
- A **Preview** may exist without an **Agent Run** (deployed manually for any branch). Teardown is manual by default; it can also be triggered programmatically via the **CLI** (e.g., from a GitHub Action on PR merge).
- A **Preview** has one or more **Preview Services**
- A **Preview Service** is backed by either a **Shared Service** or is a **Dedicated Service**
- A **Shared Service** is managed by sandfactory and used across many **Previews**
- A **Service Adapter** manages the lifecycle of isolated resources within a **Shared Service**

## Example dialogue

> **Dev:** "I just registered a new **Project** -- how do I test the agent's changes?"
> **Domain expert:** "Trigger an **Agent Run** from the UI. Once it finishes and pushes commits, you can deploy a **Preview** from that branch."
>
> **Dev:** "Each **Preview** gets its own Postgres container?"
> **Domain expert:** "No -- Postgres is a **Shared Service**. The **Service Adapter** creates a new database within it for each **Preview**. Only services configured as **Dedicated** get their own container."
>
> **Dev:** "What if I need seed data instead of a database fork for a specific **Preview**?"
> **Domain expert:** "Override the service setup when triggering the **Preview** -- via the UI or the CLI's `--service` flag. The **Project Config** defines the defaults, but you can override per-preview."

## Flagged ambiguities

- "deployment" was used to mean both the act of deploying sandfactory itself and deploying a preview of a project branch -- resolved: "deployment" refers only to sandfactory's own deployment; project branches get **Previews**.
- "sandbox" overlaps with sandcastle's concept of a sandbox (the Docker container agents run in) -- resolved: sandfactory does not use the term "sandbox"; we use **Preview** for our deployed environments.
- "laber" was the original placeholder name from the project template -- resolved: the canonical name is **Sandfactory** everywhere (`@sandfactory/*` package namespace).
