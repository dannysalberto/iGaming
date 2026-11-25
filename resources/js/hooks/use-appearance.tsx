import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'system';

const prefersDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const mediaQuery = () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null);

function readStoredAppearance(): Appearance {
    if (typeof window === 'undefined') {
        return 'system';
    }
    const saved = localStorage.getItem('appearance');

    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

const applyTheme = (appearance: Appearance) => {
    if (typeof document === 'undefined') {
        return;
    }
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const handleSystemThemeChange = () => {
    applyTheme(readStoredAppearance());
};

function subscribe(callback: () => void) {
    listeners.add(callback);

    return () => {
        listeners.delete(callback);
    };
}

export function initializeTheme() {
    currentAppearance = readStoredAppearance();
    applyTheme(currentAppearance);

    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'system' as Appearance,
    );

    const updateAppearance = useCallback((mode: Appearance) => {
        currentAppearance = mode;
        if (typeof window !== 'undefined') {
            localStorage.setItem('appearance', mode);
        }
        applyTheme(mode);
        listeners.forEach((l) => l());
    }, []);

    useEffect(() => {
        const saved = readStoredAppearance();
        if (saved !== currentAppearance) {
            currentAppearance = saved;
            listeners.forEach((l) => l());
        }
        applyTheme(saved);

        const mq = mediaQuery();
        mq?.addEventListener('change', handleSystemThemeChange);

        return () => mq?.removeEventListener('change', handleSystemThemeChange);
    }, []);

    return { appearance, updateAppearance } as const;
}
