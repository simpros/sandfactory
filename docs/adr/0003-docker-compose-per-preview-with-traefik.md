# Docker Compose per preview with shared Traefik

Each preview deployment is a dynamically generated Docker Compose stack containing the app container and any dedicated service containers. A shared Traefik reverse proxy auto-discovers preview containers via Docker labels and routes traffic to them. Preview URLs use short IDs (e.g., `k9f2m.preview.example.com`) under a wildcard domain, keeping URLs clean and avoiding issues with long branch names or nested subdomain TLS certs.

## Considered Options

- **Dynamic port allocation without a reverse proxy** -- simpler but results in meaningless URLs like `server:34567`, no TLS, and no readable access pattern. Rejected.
- **Per-preview subdomain with project and branch names** (e.g., `project--branch.preview.example.com`) -- human-readable but problematic with long branch names and special characters. Rejected in favor of short IDs with full context available in the UI.
- **Running previews inside sandcastle's own sandbox containers** -- would couple preview lifetime to agent runtime. Rejected because previews need to outlive agent runs.

## Consequences

- The dev-server must have a wildcard DNS entry pointing to it and Traefik running as a shared service.
- Sandfactory generates Docker Compose files on the fly for each preview, including Traefik labels for routing.
- Preview URLs are opaque short IDs; the mapping to project/branch is stored in sandfactory's database and displayed in the UI.
