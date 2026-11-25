import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Button } from '@/components/ui/button';
import type { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { DoorOpen, Layers, Library, Plus, RefreshCw, Search } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { BookSearch } from './book-search';
import { LibraryMenu } from './library-menu';

interface LibraryHeaderProps {
    categoriesCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading: boolean;
    onRefresh: () => void;
    onOpenCategories: () => void;
    onNewBook: () => void;
}

const MOBILE_SEARCH_ID = 'mobile-search';

/**
 * Encabezado fijo. Desde `lg` muestra el buscador en el centro y todas las acciones como botones.
 * Por debajo queda compacto: lupa (despliega una barra de búsqueda debajo), nuevo libro y un menú "⋯".
 */
export function LibraryHeader({ categoriesCount, searchQuery, onSearchChange, loading, onRefresh, onOpenCategories, onNewBook }: LibraryHeaderProps) {
    const { auth } = usePage<SharedData>().props;

    // Si la página se abre con ?search=..., la barra arranca desplegada para que se vea que hay un filtro activo
    const [searchOpen, setSearchOpen] = useState(searchQuery !== '');
    const hasText = searchQuery !== '';

    const toggleSearch = () => {
        // Con texto escrito la barra no se pliega: plegarla ocultaría un filtro activo
        setSearchOpen(!(searchOpen && !hasText));
    };

    const handleSearchKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Escape') {
            return;
        }

        if (hasText) {
            onSearchChange('');
        } else {
            setSearchOpen(false);
        }
    };

    return (
        // Fijo arriba al hacer scroll; z-30 queda por debajo de menús, diálogos (z-50) y avisos (z-100)
        <header className="bg-background sticky top-0 z-30 border-b shadow-xs">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3 lg:w-64 lg:shrink-0">
                    <div className="bg-primary text-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm">
                        <Library className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">Biblioteca</h1>
                        <p className="text-muted-foreground hidden truncate text-xs sm:block">{auth.user.email}</p>
                    </div>
                </div>

                <BookSearch value={searchQuery} onChange={onSearchChange} className="hidden max-w-md flex-1 lg:block" />

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="hidden lg:inline-flex"
                        aria-label="Recargar listado"
                        title="Recargar listado"
                        disabled={loading}
                        onClick={onRefresh}
                    >
                        <RefreshCw className={loading ? 'animate-spin' : undefined} aria-hidden />
                    </Button>

                    <AppearanceToggleDropdown className="hidden lg:flex" />

                    <Button variant="outline" className="hidden lg:inline-flex" onClick={onOpenCategories}>
                        <Layers aria-hidden />
                        Categorías
                        <span className="bg-muted rounded-full px-1.5 text-xs tabular-nums">{categoriesCount}</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="lg:hidden"
                        aria-label="Buscar libros"
                        aria-expanded={searchOpen}
                        aria-controls={MOBILE_SEARCH_ID}
                        onClick={toggleSearch}
                    >
                        <Search aria-hidden />
                    </Button>

                    <Button onClick={onNewBook}>
                        <Plus aria-hidden />
                        <span className="hidden sm:inline">Nuevo libro</span>
                        <span className="sr-only sm:hidden">Nuevo libro</span>
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="hidden lg:inline-flex"
                        title="Cerrar sesión"
                        onClick={() => router.post(route('logout'))}
                    >
                        <DoorOpen aria-hidden />
                        Salir
                    </Button>

                    <div className="lg:hidden">
                        <LibraryMenu
                            email={auth.user.email}
                            categoriesCount={categoriesCount}
                            loading={loading}
                            onRefresh={onRefresh}
                            onOpenCategories={onOpenCategories}
                        />
                    </div>
                </div>
            </div>

            {searchOpen && (
                <div id={MOBILE_SEARCH_ID} className="border-t px-4 py-2 sm:px-6 lg:hidden" onKeyDown={handleSearchKeyDown}>
                    {/* Solo se enfoca al abrirla con la lupa, no cuando arranca desplegada por la URL */}
                    <BookSearch value={searchQuery} onChange={onSearchChange} autoFocus={!hasText} />
                </div>
            )}
        </header>
    );
}
