import { useCallback, useState } from 'react';

function readParam(key: string): string {
    if (typeof window === 'undefined') {
        return '';
    }

    return new URLSearchParams(window.location.search).get(key) ?? '';
}

/**
 * Estado de un string sincronizado con un parámetro de la URL (?clave=valor): los filtros
 * sobreviven a recargas y se pueden compartir. Usa `replaceState`, así que filtrar no llena el
 * historial de entradas y el botón Atrás sale de la página en lugar de deshacer cada filtro.
 * El valor inicial se lee de la URL (seguro en SSR); después el estado de React manda.
 */
export function useUrlState(key: string): [string, (value: string) => void] {
    const [value, setValue] = useState(() => readParam(key));

    const update = useCallback(
        (next: string) => {
            setValue(next);
            if (typeof window === 'undefined') {
                return;
            }

            const url = new URL(window.location.href);
            const current = url.searchParams.get(key) ?? '';
            if (current === next) {
                return;
            }

            if (next) {
                url.searchParams.set(key, next);
            } else {
                url.searchParams.delete(key);
            }
            window.history.replaceState(window.history.state, '', url);
        },
        [key],
    );

    return [value, update];
}
