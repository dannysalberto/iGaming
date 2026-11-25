import { Button } from '@/components/ui/button';
import { PAGE_SIZE } from '@/hooks/use-books';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import type { Book } from '@/types/library';
import { BookOpen, Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import { BookCard } from './book-card';

interface BookListProps {
    books: Book[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    /** Texto de búsqueda activo (vacío si no hay). */
    searchTerm: string;
    hasCategoryFilter: boolean;
    onLoadMore: () => void;
    onRetry: () => void;
    onEdit: (book: Book) => void;
    onDelete: (book: Book) => void;
    onCreate: () => void;
    onClearFilters: () => void;
}

const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3';

function RetryButton({ onRetry, size }: { onRetry: () => void; size?: 'sm' }) {
    return (
        <Button variant="outline" size={size} onClick={onRetry}>
            <RefreshCw aria-hidden />
            Reintentar
        </Button>
    );
}

/** Decide qué mostrar del listado: carga, error, vacío o resultados con scroll infinito. */
export function BookList({
    books,
    loading,
    loadingMore,
    hasMore,
    error,
    searchTerm,
    hasCategoryFilter,
    onLoadMore,
    onRetry,
    onEdit,
    onDelete,
    onCreate,
    onClearFilters,
}: BookListProps) {
    const sentinelRef = useInfiniteScroll(onLoadMore);
    const hasSearch = searchTerm !== '';

    if (loading) {
        return (
            <div className={GRID}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-card h-56 animate-pulse rounded-xl border p-5" />
                ))}
            </div>
        );
    }

    if (error && books.length === 0) {
        return (
            <div role="alert" className="bg-card rounded-xl border border-dashed p-12 text-center">
                <TriangleAlert className="text-destructive/70 mx-auto h-12 w-12" aria-hidden />
                <h3 className="mt-3 text-base font-semibold">No se pudo cargar la lista</h3>
                <p className="text-muted-foreground mt-1 text-sm">{error}</p>
                <div className="mt-5">
                    <RetryButton onRetry={onRetry} />
                </div>
            </div>
        );
    }

    if (books.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-dashed p-12 text-center">
                <BookOpen className="text-muted-foreground/50 mx-auto h-12 w-12" aria-hidden />
                <h3 className="mt-3 text-base font-semibold">{hasSearch ? 'Sin resultados' : 'No se encontraron libros'}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{emptyMessage(searchTerm, hasCategoryFilter)}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                    {(hasSearch || hasCategoryFilter) && (
                        <Button variant="outline" onClick={onClearFilters}>
                            Quitar filtros
                        </Button>
                    )}
                    {!hasSearch && (
                        <Button onClick={onCreate}>
                            <Plus aria-hidden />
                            Registrar libro
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={GRID}>
                {books.map((book) => (
                    <BookCard key={book.id} book={book} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>

            {hasMore && !error && <div ref={sentinelRef} className="h-10" />}

            {error && (
                <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center text-sm">
                    <p className="text-destructive">{error}</p>
                    <RetryButton size="sm" onRetry={onRetry} />
                </div>
            )}

            {loadingMore && (
                <p role="status" className="text-muted-foreground py-6 text-center text-sm">
                    Cargando más libros...
                </p>
            )}

            {!hasMore && !error && books.length > PAGE_SIZE && (
                <p className="text-muted-foreground py-6 text-center text-sm">Llegaste al final · {books.length} libros</p>
            )}
        </>
    );
}

function emptyMessage(searchTerm: string, hasCategoryFilter: boolean): string {
    if (searchTerm) {
        return `Ningún libro coincide con "${searchTerm}"${hasCategoryFilter ? ' en la categoría seleccionada' : ''}.`;
    }

    return hasCategoryFilter ? 'No hay libros registrados en la categoría seleccionada.' : 'Aún no hay libros registrados en el sistema.';
}
