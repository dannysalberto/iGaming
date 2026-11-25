import { describe, expect, it, vi } from 'vitest';
import { notifyFailure } from './api';
import { notify } from './toast';

vi.mock('./toast', () => ({ notify: vi.fn() }));

const fail = (status: number) => ({ ok: false as const, status, message: `fallo ${status}` });

describe('notifyFailure', () => {
    it.each([422, 409])('usa naranja (warning) cuando el usuario puede corregirlo: %i', (status) => {
        notifyFailure(fail(status));

        expect(notify).toHaveBeenLastCalledWith('warning', `fallo ${status}`);
    });

    it.each([0, 401, 404, 419, 429, 500, 503])('usa rojo (error) para un fallo real: %i', (status) => {
        notifyFailure(fail(status));

        expect(notify).toHaveBeenLastCalledWith('error', `fallo ${status}`);
    });
});
