import { notify } from '@/lib/toast';
import type { ApiFailure, ApiResponsePayload, ApiResult, FieldErrors } from '@/types/library';

export { notify };

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfHeaders(method: string): Record<string, string> {
    if (SAFE_METHODS.has(method.toUpperCase()) || typeof document === 'undefined') {
        return {};
    }

    const cookieMatch = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    if (cookieMatch?.[1]) {
        return { 'X-XSRF-TOKEN': decodeURIComponent(cookieMatch[1]) };
    }

    const metaToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (metaToken) {
        return { 'X-CSRF-TOKEN': metaToken };
    }

    return {};
}

async function refreshCsrfCookie(): Promise<void> {
    await fetch('/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });
}

async function sendFetch(endpoint: string, method: string, body?: unknown): Promise<Response> {
    const hasBody = body !== undefined;

    return fetch(endpoint, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...csrfHeaders(method),
            ...(hasBody && { 'Content-Type': 'application/json' }),
        },
        body: hasBody ? JSON.stringify(body) : undefined,
    });
}

/** Códigos que el usuario puede resolver él mismo: datos inválidos (422) o una regla de negocio en conflicto (409). */
const CORRECTABLE_STATUSES = new Set([409, 422]);

/**
 * Avisa de un fallo con el color que corresponde: naranja si el usuario puede corregirlo
 * (validación, conflicto) y rojo si es un error real (red, servidor, límite de peticiones).
 */
export function notifyFailure(failure: ApiFailure) {
    notify(CORRECTABLE_STATUSES.has(failure.status) ? 'warning' : 'error', failure.message);
}

export const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

function failure(status: number, message: string, errors?: FieldErrors): ApiResult<never> {
    return { ok: false, status, message, errors: errors && Object.keys(errors).length > 0 ? errors : undefined };
}

/**
 * Único punto de salida hacia la API con protección CSRF automática.
 * Si la sesión expiró (419), renueva la cookie XSRF-TOKEN una vez y reintenta sin perder datos del formulario.
 *
 * Nunca lanza: un fallo de red, un error del servidor o una respuesta inválida llegan como `{ ok: false, message }`,
 * con un mensaje listo para mostrar. Quien llama solo decide qué hacer con el fallo.
 */
export async function apiRequest<T>(endpoint: string, method = 'GET', body?: unknown): Promise<ApiResult<T>> {
    const normalizedMethod = method.toUpperCase();

    let res: Response;
    try {
        res = await sendFetch(endpoint, normalizedMethod, body);

        if (res.status === 419 && !SAFE_METHODS.has(normalizedMethod)) {
            await refreshCsrfCookie();
            res = await sendFetch(endpoint, normalizedMethod, body);
        }
    } catch {
        return failure(0, NETWORK_ERROR_MESSAGE);
    }

    if (res.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login';
    }

    let json: ApiResponsePayload<T>;
    try {
        json = await res.json();
    } catch {
        return failure(
            res.status,
            res.status === 429 ? 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.' : 'Respuesta inesperada del servidor.',
        );
    }

    if (res.ok && json.success === true) {
        return { ok: true, status: res.status, message: json.message, data: json.data, meta: json.meta };
    }

    return failure(res.status, json.message, json.errors);
}
