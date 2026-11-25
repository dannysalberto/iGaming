import { apiRequest, NETWORK_ERROR_MESSAGE } from '@/lib/api';
import type { Book } from '@/types/library';
import { useCallback, useEffect, useRef, useState } from 'react';

export const PAGE_SIZE = 20;

interface PageResult {
    books: Book[];
    hasMore: boolean;
}

async function requestPage(categoryId: string, search: string, page: number): Promise<PageResult> {
    const params = new URLSearchParams({ per_page: String(PAGE_SIZE), page: String(page) });
    if (categoryId) {
        params.set('category', categoryId);
    }
    if (search.trim()) {
        params.set('search', search.trim());
    }

    const result = await apiRequest<Book[]>(`/books?${params.toString()}`);
    if (!result.ok || !Array.isArray(result.data)) {
        throw new Error(result.ok ? 'Respuesta inesperada del servidor.' : result.message);
    }

    return { books: result.data, hasMore: result.meta?.has_more ?? false };
}

function messageOf(error: unknown): string {
    return error instanceof Error ? error.message : NETWORK_ERROR_MESSAGE;
}

/**
 * Lista de libros paginada por demanda. Al cambiar la categoría o la búsqueda vuelve a la primera página.
 *
 * - `reload` descarta la lista y muestra el estado de carga (acción explícita del usuario).
 * - `refresh` vuelve a pedir en silencio las páginas ya cargadas, sin saltos de scroll.
 * - `replaceBook` actualiza un libro en la lista sin tocar la red.
 */
export function useBooks(categoryId: string, search: string) {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentPage = useRef(1);
    const latestRequest = useRef(0);

    const fetchPage = useCallback(
        async (page: number) => {
            // Si el usuario cambia el filtro mientras llega otra página, descartamos la respuesta vieja
            const requestId = ++latestRequest.current;
            setError(null);
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            try {
                const result = await requestPage(categoryId, search, page);
                if (requestId !== latestRequest.current) {
                    return;
                }

                setBooks((prev) => (page === 1 ? result.books : [...prev, ...result.books]));
                setHasMore(result.hasMore);
                currentPage.current = page;
            } catch (e) {
                if (requestId !== latestRequest.current) {
                    return;
                }

                setError(messageOf(e));
                if (page === 1) {
                    setBooks([]);
                    setHasMore(false);
                    currentPage.current = 1;
                }
            } finally {
                if (requestId === latestRequest.current) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        [categoryId, search],
    );

    const reload = useCallback(() => fetchPage(1), [fetchPage]);

    const refresh = useCallback(async () => {
        const requestId = ++latestRequest.current;
        const pagesLoaded = currentPage.current;

        try {
            let all: Book[] = [];
            let more = false;
            let lastPage = 0;

            for (let page = 1; page <= pagesLoaded; page++) {
                const result = await requestPage(categoryId, search, page);
                if (requestId !== latestRequest.current) {
                    return;
                }

                all = [...all, ...result.books];
                more = result.hasMore;
                lastPage = page;
                if (!more) {
                    break;
                }
            }

            setBooks(all);
            setHasMore(more);
            setError(null);
            currentPage.current = Math.max(lastPage, 1);
        } catch (e) {
            if (requestId === latestRequest.current) {
                setError(messageOf(e));
            }
        }
    }, [categoryId, search]);

    const loadMore = useCallback(() => {
        // Con un error pendiente no reintentamos solos: el usuario decide con "Reintentar"
        if (loading || loadingMore || !hasMore || error) {
            return;
        }
        fetchPage(currentPage.current + 1);
    }, [loading, loadingMore, hasMore, error, fetchPage]);

    /** Reintenta lo que falló: la siguiente página si ya había libros, o la primera si no. */
    const retry = useCallback(() => fetchPage(books.length > 0 ? currentPage.current + 1 : 1), [books.length, fetchPage]);

    const replaceBook = useCallback((updated: Book) => {
        setBooks((prev) => prev.map((book) => (book.id === updated.id ? updated : book)));
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    return { books, loading, loadingMore, hasMore, error, loadMore, reload, refresh, retry, replaceBook };
}
