import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCarousel } from './use-carousel';

// jsdom no calcula layout: fijamos las medidas que lee el hook
function setMetrics(el: HTMLElement, { scrollWidth, clientWidth, scrollLeft }: { scrollWidth: number; clientWidth: number; scrollLeft: number }) {
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
    el.scrollLeft = scrollLeft;
}

function Harness({ onChipClick = () => {} }: { onChipClick?: () => void }) {
    const carousel = useCarousel<HTMLDivElement>();

    return (
        <div>
            <div ref={carousel.ref} data-testid="strip" {...carousel.dragHandlers}>
                <button onClick={onChipClick}>chip</button>
            </div>
            <span data-testid="state">{`${carousel.canScrollStart}|${carousel.canScrollEnd}|${carousel.dragging}`}</span>
            <button onClick={() => carousel.scrollByPage(1)}>siguiente</button>
        </div>
    );
}

beforeEach(() => {
    vi.stubGlobal(
        'ResizeObserver',
        class {
            observe() {}
            disconnect() {}
        },
    );
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useCarousel', () => {
    it('indica en qué lado queda contenido oculto según la posición del scroll', () => {
        render(<Harness />);
        const strip = screen.getByTestId('strip');

        setMetrics(strip, { scrollWidth: 800, clientWidth: 300, scrollLeft: 0 });
        fireEvent.scroll(strip);
        expect(screen.getByTestId('state').textContent).toBe('false|true|false');

        setMetrics(strip, { scrollWidth: 800, clientWidth: 300, scrollLeft: 200 });
        fireEvent.scroll(strip);
        expect(screen.getByTestId('state').textContent).toBe('true|true|false');

        setMetrics(strip, { scrollWidth: 800, clientWidth: 300, scrollLeft: 500 });
        fireEvent.scroll(strip);
        expect(screen.getByTestId('state').textContent).toBe('true|false|false');
    });

    it('no marca ningún borde si todo cabe', () => {
        render(<Harness />);
        const strip = screen.getByTestId('strip');

        setMetrics(strip, { scrollWidth: 300, clientWidth: 300, scrollLeft: 0 });
        fireEvent.scroll(strip);

        expect(screen.getByTestId('state').textContent).toBe('false|false|false');
    });

    it('scrollByPage avanza el 80 % del ancho visible', () => {
        render(<Harness />);
        const strip = screen.getByTestId('strip');
        setMetrics(strip, { scrollWidth: 800, clientWidth: 300, scrollLeft: 0 });
        const scrollBy = vi.fn();
        strip.scrollBy = scrollBy;

        fireEvent.click(screen.getByText('siguiente'));

        expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });
    });

    it('convierte la rueda vertical en desplazamiento horizontal mientras haya recorrido', () => {
        render(<Harness />);
        const strip = screen.getByTestId('strip');
        setMetrics(strip, { scrollWidth: 800, clientWidth: 300, scrollLeft: 0 });

        const moved = fireEvent.wheel(strip, { deltaY: 100 });
        expect(strip.scrollLeft).toBe(100);
        expect(moved).toBe(false); // preventDefault: la página no baja

        // Al principio y rueda hacia arriba no hay recorrido: la página debe seguir su curso
        setMetrics(strip, { scrollWidth: 800, clientWidth: 300, scrollLeft: 0 });
        expect(fireEvent.wheel(strip, { deltaY: -100 })).toBe(true);

        // Un gesto con componente horizontal (trackpad) no se toca
        expect(fireEvent.wheel(strip, { deltaX: 20, deltaY: 100 })).toBe(true);
    });

    it('un clic normal llega al chip', () => {
        const onChipClick = vi.fn();
        render(<Harness onChipClick={onChipClick} />);

        fireEvent.click(screen.getByText('chip'));

        expect(onChipClick).toHaveBeenCalledTimes(1);
    });

    it('arrastrar con el ratón desplaza la fila y el clic posterior no activa el chip', () => {
        vi.useFakeTimers();
        const onChipClick = vi.fn();
        render(<Harness onChipClick={onChipClick} />);
        const strip = screen.getByTestId('strip');
        setMetrics(strip, { scrollWidth: 800, clientWidth: 300, scrollLeft: 100 });
        strip.setPointerCapture = vi.fn();
        strip.releasePointerCapture = vi.fn();
        strip.hasPointerCapture = vi.fn().mockReturnValue(true);
        const chip = screen.getByText('chip');

        const pointer = { pointerType: 'mouse', pointerId: 1, button: 0 };
        fireEvent.pointerDown(chip, { ...pointer, clientX: 200 });
        act(() => {
            fireEvent.pointerMove(strip, { ...pointer, clientX: 150 });
        });
        expect(strip.scrollLeft).toBe(150); // arrastrar 50 px a la izquierda mueve el contenido 50 px
        expect(screen.getByTestId('state').textContent).toContain('|true');

        fireEvent.pointerUp(strip, { ...pointer, clientX: 150 });
        fireEvent.click(chip);
        expect(onChipClick).not.toHaveBeenCalled();

        // Pasado el instante del clic de arrastre, los clics vuelven a funcionar
        act(() => vi.runAllTimers());
        fireEvent.click(chip);
        expect(onChipClick).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    it('ignora el arrastre táctil (ya se desplaza de forma nativa)', () => {
        render(<Harness />);
        const strip = screen.getByTestId('strip');
        setMetrics(strip, { scrollWidth: 800, clientWidth: 300, scrollLeft: 100 });

        const touch = { pointerType: 'touch', pointerId: 2, button: 0 };
        fireEvent.pointerDown(strip, { ...touch, clientX: 200 });
        fireEvent.pointerMove(strip, { ...touch, clientX: 100 });

        expect(strip.scrollLeft).toBe(100);
    });
});
