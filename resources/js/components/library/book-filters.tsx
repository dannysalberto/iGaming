import { Button } from '@/components/ui/button';
import { useCarousel } from '@/hooks/use-carousel';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/library';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { useEffect } from 'react';

interface BookFiltersProps {
    categories: Category[];
    selectedCategory: string;
    onCategoryChange: (categoryId: string) => void;
}

const CHIP = 'shrink-0 rounded-full whitespace-nowrap';

export function BookFilters({ categories, selectedCategory, onCategoryChange }: BookFiltersProps) {
    const carousel = useCarousel<HTMLDivElement>();
    // Las flechas solo existen si no caben todos los chips; con ellas visibles el espacio es fijo, así que no hay saltos al desplazar
    const overflowing = carousel.canScrollStart || carousel.canScrollEnd;

    // Con muchas categorías la fila se desplaza: mantenemos a la vista la categoría activa
    useEffect(() => {
        const container = carousel.ref.current;
        const active = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
        if (!container || !active) {
            return;
        }

        // Posición medida con getBoundingClientRect: no depende de qué ancestro es el `offsetParent`
        const containerRect = container.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        const offsetInsideContainer = activeRect.left - containerRect.left;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        container.scrollTo({
            left: container.scrollLeft + offsetInsideContainer - (containerRect.width - activeRect.width) / 2,
            behavior: reduceMotion ? 'auto' : 'smooth',
        });
    }, [selectedCategory, categories.length, carousel.ref]);

    return (
        <div className="bg-card text-card-foreground mb-6 rounded-xl border p-4 shadow-xs">
            <div role="group" aria-label="Filtrar por categoría" className="flex min-w-0 items-center gap-2">
                <span className="text-muted-foreground mr-1 hidden shrink-0 items-center gap-1.5 text-xs font-semibold tracking-wider whitespace-nowrap uppercase sm:inline-flex">
                    <Filter className="h-3.5 w-3.5" aria-hidden />
                    Categoría:
                </span>

                {/* [‹] [fila con scroll] [›]: las flechas son hermanas de la fila y tienen su propio espacio, nunca tapan un chip */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    {overflowing && <CarouselArrow direction="prev" enabled={carousel.canScrollStart} onClick={() => carousel.scrollByPage(-1)} />}

                    <div
                        ref={carousel.ref}
                        {...carousel.dragHandlers}
                        className={cn(
                            'flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                            '[@media(pointer:fine)]:cursor-grab',
                            carousel.dragging && 'select-none [@media(pointer:fine)]:cursor-grabbing',
                        )}
                    >
                        {categories.map((cat) => {
                            const active = selectedCategory === String(cat.id);

                            return (
                                <Button
                                    key={cat.id}
                                    type="button"
                                    size="sm"
                                    variant={active ? 'default' : 'secondary'}
                                    aria-pressed={active}
                                    className={CHIP}
                                    // Tocar la categoría activa quita el filtro (se ven todos los libros)
                                    title={active ? 'Quitar filtro' : undefined}
                                    onClick={() => onCategoryChange(active ? '' : String(cat.id))}
                                >
                                    {cat.name}
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 text-[11px] tabular-nums',
                                            active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-foreground/10 text-muted-foreground',
                                        )}
                                    >
                                        {cat.books_count ?? 0}
                                    </span>
                                    {active && <X className="h-3.5 w-3.5" aria-hidden />}
                                </Button>
                            );
                        })}
                    </div>

                    {overflowing && <CarouselArrow direction="next" enabled={carousel.canScrollEnd} onClick={() => carousel.scrollByPage(1)} />}
                </div>
            </div>
        </div>
    );
}

interface CarouselArrowProps {
    direction: 'prev' | 'next';
    /** Si hay más contenido en esa dirección. Si no, la flecha sigue ahí (sin saltos) pero atenuada. */
    enabled: boolean;
    onClick: () => void;
}

/**
 * Flecha del carrusel. Usa aria-disabled en lugar de disabled para no perder el foco del teclado
 * justo al llegar al extremo.
 */
function CarouselArrow({ direction, enabled, onClick }: CarouselArrowProps) {
    const isPrev = direction === 'prev';

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={isPrev ? 'Ver categorías anteriores' : 'Ver más categorías'}
            aria-disabled={!enabled}
            className="h-8 w-8 shrink-0 rounded-full aria-disabled:cursor-default aria-disabled:opacity-40"
            onClick={() => enabled && onClick()}
        >
            {isPrev ? <ChevronLeft aria-hidden /> : <ChevronRight aria-hidden />}
        </Button>
    );
}
