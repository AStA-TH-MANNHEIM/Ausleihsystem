<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import userStore from '$lib/stores/userStore';
	import { Button } from '$lib/components/ui/button';

	$: userName = $userStore.username;

	function logoutButton() {
		userStore.set({ username: '' });
		goto('/logout');
	}

	let darkMode = false;

	onMount(() => {
		darkMode = document.documentElement.classList.contains('dark');
	});

	function toggleDarkMode() {
		darkMode = !darkMode;
		if (darkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('color-theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('color-theme', 'light');
		}
	}
</script>

<nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2">
			<img
				class="h-9 block dark:hidden"
				src="/images/logo_studierendenschaft_mannheim-light.png"
				alt="AStA-Ausleihsystem Logo"
			/>
			<img
				class="h-9 hidden dark:block"
				src="/images/logo_studierendenschaft_mannheim-dark.png"
				alt="AStA-Ausleihsystem Logo"
			/>
		</a>

		<!-- Right side -->
		<div class="flex items-center gap-2">
			{#if userName}
				<Button variant="ghost" size="sm" class="hidden sm:inline-flex" on:click={() => goto('/admin')}>
					Adminpanel
				</Button>
				<Button variant="ghost" size="sm" class="hidden sm:inline-flex" on:click={() => logoutButton()}>
					Logout
				</Button>
			{:else}
				<Button variant="ghost" size="sm" class="hidden sm:inline-flex" on:click={() => goto('/login')}>
					Login
				</Button>
			{/if}

			<!-- Dark mode toggle -->
			<Button variant="ghost" size="icon" on:click={toggleDarkMode} aria-label="Dark mode umschalten">
				{#if darkMode}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{/if}
			</Button>
		</div>
	</div>
</nav>
