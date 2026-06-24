<script>
  export let error;
  export let status;
</script>

<svelte:head>
  <title>{status} - Error</title>
</svelte:head>

<h1>💥 Error</h1>

<p>{error?.message ?? 'Something went wrong.'}</p>

{#if error?.stack}
  <details>
    <summary>Stack Trace</summary>
    <pre>{error.stack}</pre>
  </details>
{/if}