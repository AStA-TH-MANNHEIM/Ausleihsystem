import { writable } from 'svelte/store';

const userStore = writable({
	username: ''
});

export default userStore;
