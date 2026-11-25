import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LibraryHeader } from './library-header';

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { auth: { user: { email: 'lector@example.com' } } } }),
    router: { post: vi.fn() },
}));

beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});

function Harness({ initialSearch = '' }: { initialSearch?: string }) {
    const [search, setSearch] = useState(initialSearch);

    return (
        <LibraryHeader
            categoriesCount={3}
            searchQuery={search}
            onSearchChange={setSearch}
            loading={false}
            onRefresh={() => {}}
            onOpenCategories={() => {}}
            onNewBook={() => {}}
        />
    );
}

// La barra móvil es la única con id fijo; el buscador del encabezado completo siempre está montado (oculto por CSS)
const mobileBar = () => document.getElementById('mobile-search');
const lupa = () => screen.getByRole('button', { name: 'Buscar libros' });

describe('LibraryHeader: búsqueda en móvil', () => {
    it('arranca plegada y la lupa la despliega con el foco listo para escribir', () => {
        render(<Harness />);
        expect(mobileBar()).toBeNull();
        expect(lupa().getAttribute('aria-expanded')).toBe('false');

        fireEvent.click(lupa());

        expect(mobileBar()).not.toBeNull();
        expect(lupa().getAttribute('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(mobileBar()!.querySelector('input'));
    });

    it('la lupa vuelve a plegar la barra si está vacía', () => {
        render(<Harness />);
        fireEvent.click(lupa());

        fireEvent.click(lupa());

        expect(mobileBar()).toBeNull();
    });

    it('con texto escrito la barra no se pliega: ocultaría un filtro activo', () => {
        render(<Harness />);
        fireEvent.click(lupa());
        fireEvent.change(mobileBar()!.querySelector('input')!, { target: { value: 'borges' } });

        fireEvent.click(lupa());

        expect(mobileBar()).not.toBeNull();
    });

    it('arranca desplegada, sin robar el foco, si la página se abre con una búsqueda en la URL', () => {
        render(<Harness initialSearch="borges" />);

        const input = mobileBar()!.querySelector('input')!;
        expect(input.value).toBe('borges');
        expect(document.activeElement).not.toBe(input);
    });

    it('Escape borra el texto y, con la barra ya vacía, la pliega', () => {
        render(<Harness initialSearch="borges" />);
        const input = mobileBar()!.querySelector('input')!;

        fireEvent.keyDown(input, { key: 'Escape' });
        expect(input.value).toBe('');
        expect(mobileBar()).not.toBeNull();

        fireEvent.keyDown(input, { key: 'Escape' });
        expect(mobileBar()).toBeNull();
    });

    it('limpiar con la X deja la barra abierta para seguir escribiendo', () => {
        render(<Harness initialSearch="borges" />);

        fireEvent.click(within(mobileBar()!).getByRole('button', { name: 'Limpiar búsqueda' }));

        expect(mobileBar()).not.toBeNull();
        expect(mobileBar()!.querySelector('input')!.value).toBe('');
    });
});
