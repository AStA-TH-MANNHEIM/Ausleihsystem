<script lang="ts">
	import ContentCard from '$lib/components/ContentCard.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { writable } from 'svelte/store';
	import { enhance } from '$app/forms';

	const pending = writable(false);
	const errorMessage = writable('');
</script>

<ContentCard classes="max-w-md" variant="variant-ghost border border-surface-300 dark:border-surface-600">
	<span slot="header">Login</span>

	<form class="space-y-4" method="post"
		use:enhance={() => {
			pending.set(true);
			errorMessage.set('');
			return async ({ result, update }) => {
				if (result.type === 'failure' && result.data?.message) {
					errorMessage.set(result.data.message);
				} else if (result.type === 'error') {
					errorMessage.set('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.');
				}
				pending.set(false);
				await update({ reset: false });
			}
		}}
	>
		<div class="space-y-2">
			<Label for="username">Benutzername</Label>
			<Input
				name="username"
				id="username"
				placeholder="Benutzername"
				autocomplete="username"
				required
			/>
		</div>

		<div class="space-y-2">
			<Label for="password">Passwort</Label>
			<Input
				type="password"
				name="password"
				id="password"
				placeholder="Passwort"
				autocomplete="current-password"
				required
			/>
		</div>

		{#if $errorMessage}
			<p class="text-sm text-destructive">{$errorMessage}</p>
		{/if}

		<div class="flex justify-end pt-2">
			<Button type="submit" disabled={$pending}>
				{#if $pending}
					Laden...
				{:else}
					Login
				{/if}
			</Button>
		</div>
	</form>
</ContentCard>
