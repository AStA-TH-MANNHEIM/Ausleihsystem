<script lang="ts">
	import { goto } from '$app/navigation';
	import userStore from '$lib/stores/userStore';

	$: userName = $userStore.username;

	function logoutButton() {
		userStore.set({ username: '' });
		goto('/logout');
	}
</script>

<div class="border-t bg-background">
	<div class="mx-auto max-w-7xl px-4 py-3">
		<!-- Mobile: auth links -->
		<div class="flex justify-center gap-4 pb-2 text-sm sm:hidden">
			{#if userName}
				<button on:click={() => goto('/admin')} class="text-muted-foreground hover:text-foreground transition-colors">Adminpanel</button>
				<button on:click={() => logoutButton()} class="text-muted-foreground hover:text-foreground transition-colors">Logout</button>
			{:else}
				<button on:click={() => goto('/login')} class="text-muted-foreground hover:text-foreground transition-colors">Login</button>
			{/if}
		</div>
		<div class="flex items-center justify-between text-sm text-muted-foreground">
			<a href="/impressum" class="hover:text-foreground transition-colors">Impressum</a>
			<a href="/datenschutz" class="hover:text-foreground transition-colors">Datenschutz</a>
		</div>
	</div>
</div>
