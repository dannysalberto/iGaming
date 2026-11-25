import { useSyncExternalStore } from 'react';

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

const MAX_TOASTS = 4;
const SERVER_SNAPSHOT: ToastItem[] = [];

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
    listeners.forEach((l) => l());
}

// Los avisos que piden actuar (corregir un dato, reintentar) duran más que una simple confirmación
const DURATIONS: Record<ToastType, number> = { success: 3500, warning: 6000, error: 8000 };

function durationFor(type: ToastType) {
    return DURATIONS[type];
}

function scheduleDismiss(id: number, ms: number) {
    const existing = timers.get(id);
    if (existing) {
        clearTimeout(existing);
    }
    timers.set(
        id,
        setTimeout(() => dismissToast(id), ms),
    );
}

export function dismissToast(id: number) {
    const timer = timers.get(id);
    if (timer) {
        clearTimeout(timer);
        timers.delete(id);
    }
    toasts = toasts.filter((t) => t.id !== id);
    emit();
}

export function pauseToast(id: number) {
    const timer = timers.get(id);
    if (timer) {
        clearTimeout(timer);
        timers.delete(id);
    }
}

export function resumeToast(id: number, type: ToastType) {
    if (toasts.some((t) => t.id === id)) {
        scheduleDismiss(id, durationFor(type));
    }
}

/** Aviso no bloqueante: no roba el foco, limita la pila visible y desaparece solo. */
export function notify(type: ToastType, message: string) {
    const id = nextId++;
    if (toasts.length >= MAX_TOASTS) {
        const oldest = toasts[0];
        if (oldest) {
            const oldTimer = timers.get(oldest.id);
            if (oldTimer) {
                clearTimeout(oldTimer);
                timers.delete(oldest.id);
            }
        }
        toasts = toasts.slice(-(MAX_TOASTS - 1));
    }

    toasts = [...toasts, { id, type, message }];
    emit();
    scheduleDismiss(id, durationFor(type));
}

function subscribe(callback: () => void) {
    listeners.add(callback);

    return () => {
        listeners.delete(callback);
    };
}

export function useToasts() {
    return useSyncExternalStore(
        subscribe,
        () => toasts,
        () => SERVER_SNAPSHOT,
    );
}
