import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ['@node-rs/argon2']
	},
	build: {
		sourcemap: true
	},
	server: {
		sourcemap: true,
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});


