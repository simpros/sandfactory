# Co-located dev-server architecture

Sandfactory, sandcastle, and all target project repositories run on the same machine (the "dev-server"). We considered separating sandfactory from the agent execution environment (e.g., sandfactory in the cloud, agents on a remote build server), but co-location eliminates the need for remote file access, artifact shipping, or repo cloning -- sandcastle's worktrees and branches are directly accessible on the local filesystem. This also simplifies preview deployments since sandfactory can manage Docker containers on the same host.

## Considered Options

- **Separate server for sandfactory** -- sandfactory hosted elsewhere, communicating with the dev-server via API. Rejected because it adds network latency, requires repo syncing, and complicates Docker management for previews.
- **Cloud-hosted with remote agents** -- sandfactory and agents both in the cloud (e.g., Vercel sandboxes). Rejected because it doesn't support the per-project database forking and custom service provisioning that preview deployments require.

## Consequences

- Sandfactory must be deployed to the dev-server (via Coolify, Docker, or bare process) rather than a separate hosting platform.
- All registered projects must be cloned locally on the dev-server.
- The dev-server is a single point of failure for both agent runs and previews.
