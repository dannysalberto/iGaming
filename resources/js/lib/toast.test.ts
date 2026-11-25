import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notify, useToasts } from './toast';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    // El almacén es un módulo con estado: dejamos que expire todo para que un test no contamine al siguiente
    act(() => vi.advanceTimersByTime(60_000));
    vi.useRealTimers();
});

const types = (result: { current: ReturnType<typeof useToasts> }) => result.current.map((t) => t.type);

describe('avisos (toast)', () => {
    it('soporta éxito, advertencia y error', () => {
        const { result } = renderHook(() => useToasts());

        act(() => {
            notify('success', 'Guardado');
            notify('warning', 'Revisa los campos');
            notify('error', 'Sin conexión');
        });

        expect(types(result)).toEqual(['success', 'warning', 'error']);
    });

    it('cada tipo dura lo que debe: lo que pide actuar permanece más tiempo', () => {
        const { result } = renderHook(() => useToasts());
        act(() => {
            notify('success', 'a');
            notify('warning', 'b');
            notify('error', 'c');
        });

        act(() => vi.advanceTimersByTime(3_500));
        expect(types(result)).toEqual(['warning', 'error']);

        act(() => vi.advanceTimersByTime(2_500));
        expect(types(result)).toEqual(['error']);

        act(() => vi.advanceTimersByTime(2_000));
        expect(types(result)).toEqual([]);
    });

    it('muestra como máximo 4 avisos a la vez y descarta el más antiguo', () => {
        const { result } = renderHook(() => useToasts());

        act(() => {
            for (let i = 1; i <= 6; i++) {
                notify('success', `aviso ${i}`);
            }
        });

        expect(result.current.map((t) => t.message)).toEqual(['aviso 3', 'aviso 4', 'aviso 5', 'aviso 6']);
    });
});
