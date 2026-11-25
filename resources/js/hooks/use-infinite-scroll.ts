import { useEffect, useState } from 'react';

/**
 * Devuelve una ref para el elemento centinela que va al final de la lista.
 * Cuando entra en pantalla (con 200px de margen) se llama a `onReach`.
 */
export function useInfiniteScroll(onReach: () => void) {
    const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!sentinel) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onReach();
                }
            },
            { rootMargin: '200px' },
        );
        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [sentinel, onReach]);

    return setSentinel;
}
