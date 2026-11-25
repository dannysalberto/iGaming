export interface Category {
    id: number;
    name: string;
    books_count?: number;
}

export interface Book {
    id: number;
    title: string;
    author: string;
    description: string | null;
    published_year: number;
    category_id: number;
    category?: Category;
}

export type FieldErrors = Record<string, string[]>;

export interface PageMeta {
    page: number;
    per_page: number;
    has_more: boolean;
}

/** Forma cruda del JSON que devuelve el servidor. Fuera de `lib/api.ts` se usa `ApiResult`. */
export interface ApiResponsePayload<T> {
    success: boolean;
    status: number;
    message: string;
    data: T;
    errors?: FieldErrors;
    meta?: PageMeta;
}

export interface ApiSuccess<T> {
    ok: true;
    status: number;
    message: string;
    data: T;
    meta?: PageMeta;
}

export interface ApiFailure {
    ok: false;
    status: number;
    message: string;
    errors?: FieldErrors;
}

/** Resultado de una llamada a la API: nunca lanza; `ok` discrimina entre éxito y fallo. */
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
