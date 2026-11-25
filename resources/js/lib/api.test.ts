import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, NETWORK_ERROR_MESSAGE } from './api';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('apiRequest', () => {
    it('devuelve los datos y la paginación cuando el servidor responde con éxito', async () => {
        const meta = { page: 1, per_page: 20, has_more: true };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ success: true, status: 200, message: 'Lista obtenida', data: [{ id: 1 }], meta })));

        const result = await apiRequest<{ id: number }[]>('/books');

        expect(result).toEqual({ ok: true, status: 200, message: 'Lista obtenida', data: [{ id: 1 }], meta });
    });

    it('no lanza ante un fallo de red: devuelve ok=false con un mensaje listo para mostrar', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

        const result = await apiRequest('/books');

        expect(result).toMatchObject({ ok: false, status: 0, message: NETWORK_ERROR_MESSAGE });
    });

    it('expone los errores de validación por campo y omite el objeto si está vacío', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                json({ success: false, status: 422, message: 'Error de validación', data: null, errors: { title: ['Obligatorio'] } }, 422),
            )
            .mockResolvedValueOnce(json({ success: false, status: 409, message: 'Conflicto', data: null, errors: {} }, 409));
        vi.stubGlobal('fetch', fetchMock);

        expect(await apiRequest('/books', 'POST', {})).toMatchObject({ ok: false, errors: { title: ['Obligatorio'] } });
        expect(await apiRequest('/books', 'POST', {})).toMatchObject({ ok: false, message: 'Conflicto', errors: undefined });
    });

    it('trata una respuesta HTTP 200 con success=false como fallo', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ success: false, status: 200, message: 'No', data: null })));

        expect(await apiRequest('/books')).toMatchObject({ ok: false, message: 'No' });
    });

    it('distingue un 429 sin JSON de otras respuestas inválidas', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response('<html>', { status: 429 }))
            .mockResolvedValueOnce(new Response('<html>', { status: 502 }));
        vi.stubGlobal('fetch', fetchMock);

        expect(await apiRequest('/books')).toMatchObject({
            ok: false,
            status: 429,
            message: 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
        });
        expect(await apiRequest('/books')).toMatchObject({ ok: false, status: 502, message: 'Respuesta inesperada del servidor.' });
    });

    it('ante un 419 en una escritura renueva la cookie CSRF y reintenta una vez', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(json({ success: false, status: 419, message: 'Expiró', data: null }, 419))
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(json({ success: true, status: 201, message: 'Creado', data: { id: 9 } }, 201));
        vi.stubGlobal('fetch', fetchMock);

        const result = await apiRequest('/books', 'POST', { title: 'x' });

        expect(result).toMatchObject({ ok: true, status: 201, data: { id: 9 } });
        expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/books', '/csrf-cookie', '/books']);
    });

    it('no reintenta un 419 en una lectura', async () => {
        const fetchMock = vi.fn().mockResolvedValue(json({ success: false, status: 419, message: 'Expiró', data: null }, 419));
        vi.stubGlobal('fetch', fetchMock);

        expect(await apiRequest('/books')).toMatchObject({ ok: false, status: 419 });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
