import { persisted } from 'svelte-persisted-store';

import { logger } from '$lib/logger';

const defaultState = {
  itemId: null,
  page: 1,
  pageSize: 5,
  sortBy: 'id',
  sortOrder: 'desc',
  filters: {},
  totalItems: 0,
  search: ''
};

// Create the persisted store
const baseStore = persisted('userTableState', defaultState, { storage: 'session' });

// Wrap it with update functions
export const userTableStore = {
  subscribe: baseStore.subscribe,
  set: baseStore.set,
  update: baseStore.update,

  updateItemId: (itemId) =>
    baseStore.update(state => ({ ...state, itemId })),

  updatePage: (page) =>
    baseStore.update(state => ({ ...state, page })),

  updatePageSize: (pageSize) =>
    baseStore.update(state => ({ ...state, pageSize })),

  updateSortBy: (sortBy) =>
    baseStore.update(state => ({ ...state, sortBy })),

  updateSortOrder: (sortOrder) =>
    baseStore.update(state => ({ ...state, sortOrder })),

  updateFilters: (filters) =>
    baseStore.update(state => ({ ...state, filters })),

  setTotalItems: (totalItems) =>
    baseStore.update(state => ({ ...state, totalItems })),

  setSearch: (search) =>
    baseStore.update(state => ({ ...state, search })),

  reset: () => baseStore.set(defaultState)
};
