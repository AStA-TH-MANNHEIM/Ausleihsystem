import { persisted } from 'svelte-persisted-store';

export type PickedItem = {
	itemId: string;
	articleName: string;
	bezeichnung: string;
	quantity: number; // how many the user wants
	maxAvailable: number;
};

export type ReservationFormState = {
	// Step 1: Credentials
	/** Ausleihertypen, automatisch aus der E-Mail-Adresse abgeleitet. */
	lenderTypeIds: number[];
	vorname: string;
	nachname: string;
	email: string;
	phone: string;
	reason: string;
	verwendungsort: string;

	// Step 2: Dates
	startDate: string;
	endDate: string;
	verwendungsStart: string;
	verwendungsEnd: string;

	// Step 3: Items
	pickedItems: PickedItem[];
};

const defaultState: ReservationFormState = {
	lenderTypeIds: [],
	vorname: '',
	nachname: '',
	email: '',
	phone: '',
	reason: '',
	verwendungsort: '',
	startDate: '',
	endDate: '',
	verwendungsStart: '',
	verwendungsEnd: '',
	pickedItems: []
};

export const reservationStore = persisted<ReservationFormState>('reservation-form', defaultState);

export function resetReservationStore() {
	reservationStore.set({ ...defaultState });
}
