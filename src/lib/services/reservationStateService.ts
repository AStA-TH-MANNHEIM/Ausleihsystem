import { logger } from '$lib/logger';
import { AusleihStatusSchema,  type Ausleihe} from '$lib/generated/zod';
const AusleihStatus = AusleihStatusSchema.Enum;

export const transitions = {
  Angemeldet: [AusleihStatus.Storniert],
  Verifiziert: [AusleihStatus.Storniert],
  Reserviert: [AusleihStatus.Storniert, AusleihStatus.Verifiziert],
  Gebucht: [AusleihStatus.Storniert],
  ImGange: [AusleihStatus.Abgeschlossen, AusleihStatus.AbgeschlUnvollst],
  Abgeschlossen: [],
  AbgeschlUnvollst: [],
  Storniert: [],
} as const;

const statusOrder: Record<string, number> = {
  Angemeldet: 1,
  Verifiziert: 2,
  Reserviert: 3,
  Gebucht: 4,
  ImGange: 5,
  AbgeschlUnvollst: 99,
  Abgeschlossen: 99,
  Storniert: 99, 
};

export function isBefore(check: string, against: string) {
    return statusOrder[check] < statusOrder[against];
}
export function isAfter(check: string, against: string) {
    return statusOrder[check] > statusOrder[against];
}

type ReservationState = keyof typeof transitions; // ✅ 'Angemeldet' | 'Verifiziert' | ...

type StateGraph = Record<ReservationState, ReservationState[]>;

const validStates = Object.keys(transitions) as ReservationState[];

function isReservationState(value: string): value is ReservationState {
  return validStates.includes(value as ReservationState);
}

export function selectListValues(from: string): string[] {
    if(isReservationState(from)) {
        return [
            ...transitions[from],
            from
        ];
    } else {
        return [];
    }
}

export function canTransition(from: string, to: string, alwaysAllowSame: boolean = false): boolean {
    if(alwaysAllowSame) {
        if(from === to) {
            return true;
        }
    }
    if(isReservationState(from) && isReservationState(to) ) {
        return transitions[from].includes(to) ?? false;
    } else {
        return false;
    }
}

export function isItemApprovePossible(state: string) {
    //logger.debug("isItemApprovePossible: ", state);
    if(isReservationState(state)) {
        if(state == AusleihStatus.Verifiziert) {
            //logger.debug("true");
            return true;
        }
    }
    //logger.debug("false");
	return false;
}


export function isItemReturnPossible(state: string) {
    if(isReservationState(state)) {
        if(state == AusleihStatus.ImGange) {
            return true;
        }
    }
	return false;
}

export function isTerminalState(state: string) {
    if(state == AusleihStatus.Storniert || state == AusleihStatus.AbgeschlUnvollst || state == AusleihStatus.Abgeschlossen) {
        return true;
    }
	return false;
}

export function isEditableStatus(status: string): boolean {
    const editableStatuses: string[] = [
        AusleihStatus.Angemeldet,
        AusleihStatus.Verifiziert,
        AusleihStatus.Reserviert,
        AusleihStatus.Gebucht
    ];
    return editableStatuses.includes(status);
}