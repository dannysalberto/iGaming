import { useEffect, useState } from 'react';

/**
 * Devuelve el valor con retraso: útil para no lanzar una petición por cada tecla que se escribe.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
