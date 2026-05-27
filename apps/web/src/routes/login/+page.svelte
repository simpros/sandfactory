<script lang="ts">
  import { authClient } from "@sandfactory/auth/client";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function handleLogin(event: SubmitEvent) {
    event.preventDefault();

    if (!password.trim()) {
      error = "Enter your password.";
      return;
    }

    error = "";
    loading = true;

    const result = await authClient.signIn.email({
      email: data.email,
      password,
      rememberMe: true,
    });

    if (result.error) {
      error = "Incorrect password.";
      loading = false;
      return;
    }

    window.location.href = "/";
  }
</script>

<svelte:head>
  <title>Login | Sandfactory</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-24px)] items-center justify-center p-8">
  <div class="bg-mac-window border border-mac-border shadow-mac-window w-full max-w-[420px]">
      <div class="h-6 mac-pinstripe border-b border-mac-border flex items-center justify-center relative select-none shrink-0">
        <button class="absolute left-1.5 size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]" type="button">
          <span class="text-[9px]">✕</span>
        </button>
        <span class="text-sm font-bold text-black leading-none">Sandfactory Login</span>
      </div>

      <form class="bg-white p-5" onsubmit={handleLogin}>
        <h1 class="mb-1 text-base font-bold text-black">Login</h1>
        <hr class="border-none border-t border-mac-border-light shadow-[0_1px_0_#fff] mb-3" />
        <p class="mb-4 text-sm leading-relaxed text-black">
          Enter the single-user password to access Sandfactory on this dev-server.
        </p>

        <label class="mb-1 block text-sm font-bold text-black" for="login-password">
          Password:
        </label>
        <input
          id="login-password"
          class="h-7 w-full px-2 bg-white border border-mac-border-dark text-sm text-black outline-none rounded-none focus:border-mac-highlight focus:shadow-mac-focus mb-3"
          placeholder="Password"
          type="password"
          bind:value={password}
        />

        {#if error}
          <div
            class="mb-3 px-3 py-2 text-[13px] text-red-700 bg-[#fff0f0] border border-[#c44]"
          >
            ⚠ {error}
          </div>
        {/if}

        <div class="flex justify-end border-t border-mac-border-light pt-2.5">
          <button class="inline-flex items-center justify-center min-w-20 h-7 px-4 mac-btn-gradient border-2 border-[#222] rounded-[5px] text-sm font-bold text-black cursor-default select-none whitespace-nowrap active:enabled:mac-btn-primary-gradient-active disabled:text-mac-border-dark" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
          </button>
        </div>
      </form>
  </div>
</div>
