<script lang="ts">
	import Sidebar from "$lib/components/admin/Sidebar.svelte";
</script>

<div class="flex h-screen">
	<Sidebar />
	<main class="flex-1 overflow-y-auto p-6">
		<slot />
	</main>
</div>
