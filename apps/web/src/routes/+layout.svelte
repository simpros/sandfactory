<script lang="ts">
  import "../app.css";

  import { authClient } from "@sandfactory/auth/client";
  import type { LayoutProps } from "./$types";
  import { PageFrame } from "@sandfactory/ui";

  let { children, data }: LayoutProps = $props();

  async function logout() {
    await authClient.signOut();

    window.location.href = "/login";
  }
</script>

<PageFrame showLogout={data.authenticated} onLogout={logout}>
  {@render children()}
</PageFrame>
