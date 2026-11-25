import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './use-debounced-value';
import { useUrlState } from './use-url-state';

describe('useUrlState', () => {
    afterEach(() => {
        window.history.replaceState(null, '', '/');
    });

    it('toma el valor inicial del parámetro de la URL', () => {
        window.history.replaceState(null, '', '/?category=3');

        const { result } = renderHook(() => useUrlState('category'));

        expect(result.current[0]).toBe('3');
    });

    it('actualiza la URL con replaceState, sin añadir entradas al historial', () => {
        const lengthBefore = window.history.length;
        const { result } = renderHook(() => useUrlState('search'));

        act(() => result.current[1]('borges'));

        expect(result.current[0]).toBe('borges');
        expect(window.location.search).toBe('?search=borges');
        expect(window.history.length).toBe(lengthBefore);
    });

    it('elimina el parámetro cuando el valor queda vacío y conserva los demás', () => {
        window.history.replaceState(null, '', '/?category=3&search=x');
        const { result } = renderHook(() => useUrlState('search'));

        act(() => result.current[1](''));

        expect(window.location.search).toBe('?category=3');
    });
});

describe('useDebouncedValue', () => {
    it('solo publica el último valor cuando pasa el retraso sin cambios', () => {
        vi.useFakeTimers();
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } });

        rerender({ value: 'ab' });
        act(() => vi.advanceTimersByTime(299));
        rerender({ value: 'abc' });
        act(() => vi.advanceTimersByTime(299));
        expect(result.current).toBe('a');

        act(() => vi.advanceTimersByTime(1));
        expect(result.current).toBe('abc');
        vi.useRealTimers();
    });
});
