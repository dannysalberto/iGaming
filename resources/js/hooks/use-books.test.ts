import { apiRequest } from '@/lib/api';
import type { ApiResult, Book } from '@/types/library';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBooks } from './use-books';

vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn(),
    notify: vi.fn(),
    NETWORK_ERROR_MESSAGE: 'Sin conexión',
}));

const apiRequestMock = vi.mocked(apiRequest);

const book = (id: number, overrides: Partial<Book> = {}): Book => ({
    id,
    title: `Libro ${id}`,
    author: 'Autor',
    description: null,
    published_year: 2000,
    category_id: 1,
    ...overrides,
});

const page = (books: Book[], hasMore: boolean): ApiResult<Book[]> => ({
    ok: true,
    status: 200,
    message: 'Lista obtenida',
    data: books,
    meta: { page: 1, per_page: 20, has_more: hasMore },
});

const failure = (message: string): ApiResult<never> => ({ ok: false, status: 500, message });

const requestedPages = () => apiRequestMock.mock.calls.map(([url]) => new URL(url, 'http://x').searchParams.get('page'));

beforeEach(() => {
    apiRequestMock.mockReset();
});

describe('useBooks', () => {
    it('carga la primera página e informa si hay más', async () => {
        apiRequestMock.mockResolvedValueOnce(page([book(1), book(2)], true));

        const { result } = renderHook(() => useBooks('', ''));
        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.books.map((b) => b.id)).toEqual([1, 2]);
        expect(result.current.hasMore).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('envía categoría y búsqueda (sin espacios sobrantes) como parámetros', async () => {
        apiRequestMock.mockResolvedValueOnce(page([], false));

        renderHook(() => useBooks('3', '  borges '));

        await waitFor(() => expect(apiRequestMock).toHaveBeenCalled());
        const params = new URL(apiRequestMock.mock.calls[0][0], 'http://x').searchParams;
        expect(params.get('category')).toBe('3');
        expect(params.get('search')).toBe('borges');
        expect(params.get('per_page')).toBe('20');
    });

    it('muestra un error (y no una lista vacía engañosa) cuando falla la primera carga', async () => {
        apiRequestMock.mockResolvedValueOnce(failure('Demasiadas solicitudes'));

        const { result } = renderHook(() => useBooks('', ''));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Demasiadas solicitudes');
        expect(result.current.books).toEqual([]);
    });

    it('reintentar tras un error de la primera carga vuelve a pedir la página 1', async () => {
        apiRequestMock.mockResolvedValueOnce(failure('Falló')).mockResolvedValueOnce(page([book(1)], false));

        const { result } = renderHook(() => useBooks('', ''));
        await waitFor(() => expect(result.current.error).toBe('Falló'));

        await act(() => result.current.retry());

        expect(result.current.error).toBeNull();
        expect(result.current.books.map((b) => b.id)).toEqual([1]);
        expect(requestedPages()).toEqual(['1', '1']);
    });

    it('conserva los libros cuando falla una página posterior y no reintenta sola', async () => {
        apiRequestMock.mockResolvedValueOnce(page([book(1)], true)).mockResolvedValueOnce(failure('Falló la página 2'));

        const { result } = renderHook(() => useBooks('', ''));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => result.current.loadMore());
        await waitFor(() => expect(result.current.error).toBe('Falló la página 2'));
        expect(result.current.books.map((b) => b.id)).toEqual([1]);

        // El observador de scroll sigue llamando a loadMore: con un error pendiente no debe pedir nada
        act(() => result.current.loadMore());
        expect(apiRequestMock).toHaveBeenCalledTimes(2);
    });

    it('reintentar tras fallar la página 2 pide la página 2 y concatena', async () => {
        apiRequestMock
            .mockResolvedValueOnce(page([book(1)], true))
            .mockResolvedValueOnce(failure('Falló'))
            .mockResolvedValueOnce(page([book(2)], false));

        const { result } = renderHook(() => useBooks('', ''));
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => result.current.loadMore());
        await waitFor(() => expect(result.current.error).toBe('Falló'));

        await act(() => result.current.retry());

        expect(result.current.books.map((b) => b.id)).toEqual([1, 2]);
        expect(result.current.hasMore).toBe(false);
        expect(requestedPages()).toEqual(['1', '2', '2']);
    });

    it('descarta la respuesta de un filtro anterior que llega tarde', async () => {
        let resolveOld!: (value: ApiResult<Book[]>) => void;
        apiRequestMock.mockImplementationOnce(() => new Promise((resolve) => (resolveOld = resolve))).mockResolvedValueOnce(page([book(20)], false));

        const { result, rerender } = renderHook(({ category }) => useBooks(category, ''), { initialProps: { category: '1' } });
        rerender({ category: '2' });
        await waitFor(() => expect(result.current.books.map((b) => b.id)).toEqual([20]));

        await act(async () => resolveOld(page([book(10)], true)));

        expect(result.current.books.map((b) => b.id)).toEqual([20]);
        expect(result.current.hasMore).toBe(false);
    });

    it('replaceBook actualiza un libro sin tocar la red', async () => {
        apiRequestMock.mockResolvedValueOnce(page([book(1), book(2)], false));
        const { result } = renderHook(() => useBooks('', ''));
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.replaceBook(book(2, { title: 'Editado' })));

        expect(result.current.books.map((b) => b.title)).toEqual(['Libro 1', 'Editado']);
        expect(apiRequestMock).toHaveBeenCalledTimes(1);
    });

    it('refresh vuelve a pedir las páginas cargadas sin mostrar el estado de carga', async () => {
        apiRequestMock
            .mockResolvedValueOnce(page([book(1)], true))
            .mockResolvedValueOnce(page([book(2)], false))
            .mockResolvedValueOnce(page([book(1)], true))
            .mockResolvedValueOnce(page([book(3)], false));

        const { result } = renderHook(() => useBooks('', ''));
        await waitFor(() => expect(result.current.loading).toBe(false));
        await act(async () => result.current.loadMore());
        await waitFor(() => expect(result.current.books).toHaveLength(2));

        const loadingStates: boolean[] = [];
        await act(async () => {
            const refreshing = result.current.refresh();
            loadingStates.push(result.current.loading);
            await refreshing;
        });

        expect(loadingStates).toEqual([false]);
        expect(result.current.books.map((b) => b.id)).toEqual([1, 3]);
        expect(requestedPages().slice(2)).toEqual(['1', '2']);
    });
});
