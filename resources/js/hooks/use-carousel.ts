import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

const DRAG_THRESHOLD_PX = 5;
const PAGE_FRACTION = 0.8;

function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Comportamiento de carrusel para una fila con `overflow-x: auto`:
 * - `canScrollStart` / `canScrollEnd`: si hay contenido oculto a cada lado (para flechas y degradados).
 * - `scrollByPage`: avanza o retrocede casi un ancho visible.
 * - La rueda del ratón desplaza en horizontal mientras haya recorrido (al llegar al borde, la página sigue).
 * - `dragHandlers`: arrastrar con el ratón. En pantallas táctiles el desplazamiento nativo ya funciona.
 */
export function useCarousel<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [edges, setEdges] = useState({ start: false, end: false });
    const [dragging, setDragging] = useState(false);

    const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
    const suppressClick = useRef(false);

    const updateEdges = useCallback(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const next = {
            start: el.scrollLeft > 1,
            end: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
        };
        setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        updateEdges();
        el.addEventListener('scroll', updateEdges, { passive: true });

        // Cambia el ancho visible (resize) o el contenido (se añaden o quitan chips)
        const resizeObserver = new ResizeObserver(updateEdges);
        resizeObserver.observe(el);
        const mutationObserver = new MutationObserver(updateEdges);
        mutationObserver.observe(el, { childList: true });

        // Rueda vertical clásica (deltaX = 0) -> horizontal. Un trackpad envía deltaX y se respeta tal cual.
        const onWheel = (e: WheelEvent) => {
            if (e.deltaX !== 0 || e.deltaY === 0 || e.ctrlKey) {
                return;
            }

            const canMove = e.deltaY > 0 ? el.scrollLeft < el.scrollWidth - el.clientWidth - 1 : el.scrollLeft > 0;
            if (canMove) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            el.removeEventListener('scroll', updateEdges);
            el.removeEventListener('wheel', onWheel);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [updateEdges]);

    const scrollByPage = useCallback((direction: 1 | -1) => {
        const el = ref.current;
        el?.scrollBy({ left: direction * el.clientWidth * PAGE_FRACTION, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, []);

    const dragHandlers = {
        onPointerDown: (e: PointerEvent<T>) => {
            if (e.pointerType !== 'mouse' || e.button !== 0 || !ref.current) {
                return;
            }
            drag.current = { active: true, moved: false, startX: e.clientX, startScroll: ref.current.scrollLeft };
        },
        onPointerMove: (e: PointerEvent<T>) => {
            const el = ref.current;
            if (!drag.current.active || !el) {
                return;
            }

            const delta = e.clientX - drag.current.startX;
            if (!drag.current.moved && Math.abs(delta) > DRAG_THRESHOLD_PX) {
                drag.current.moved = true;
                el.setPointerCapture(e.pointerId);
                setDragging(true);
            }
            if (drag.current.moved) {
                el.scrollLeft = drag.current.startScroll - delta;
            }
        },
        onPointerUp: (e: PointerEvent<T>) => endDrag(e),
        onPointerCancel: (e: PointerEvent<T>) => endDrag(e),
        // Tras arrastrar, el navegador dispara un clic sobre el chip: lo anulamos para no cambiar de filtro
        onClickCapture: (e: MouseEvent<T>) => {
            if (suppressClick.current) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
    };

    function endDrag(e: PointerEvent<T>) {
        const el = ref.current;
        if (drag.current.moved && el?.hasPointerCapture(e.pointerId)) {
            el.releasePointerCapture(e.pointerId);
            suppressClick.current = true;
            setTimeout(() => (suppressClick.current = false), 0);
        }
        drag.current.active = false;
        setDragging(false);
    }

    return { ref, canScrollStart: edges.start, canScrollEnd: edges.end, dragging, scrollByPage, dragHandlers };
}
