import { BookFilters } from '@/components/library/book-filters';
import { BookList } from '@/components/library/book-list';
import { BookModal } from '@/components/library/book-modal';
import { CategoryModal } from '@/components/library/category-modal';
import { ConfirmDialog } from '@/components/library/confirm-dialog';
import { LibraryHeader } from '@/components/library/library-header';
import { Toaster } from '@/components/library/toaster';
import { useBooks } from '@/hooks/use-books';
import { useCategories } from '@/hooks/use-categories';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useUrlState } from '@/hooks/use-url-state';
import { apiRequest, notify, notifyFailure } from '@/lib/api';
import type { Book } from '@/types/library';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function LibraryPage() {
    // Filtros en la URL (?category=3&search=borges): sobreviven a recargas y se pueden compartir
    const [selectedCategory, setSelectedCategory] = useUrlState('category');
    const [urlSearch, setUrlSearch] = useUrlState('search');
    const [searchQuery, setSearchQuery] = useState(urlSearch);
    // Esperamos a que el usuario deje de escribir antes de consultar al servidor y actualizar la URL
    const debouncedSearch = useDebouncedValue(searchQuery);
    const activeSearch = debouncedSearch.trim();

    // Sincroniza el input si la URL cambia desde el historial del navegador (popstate) sin pisar espacios al escribir
    useEffect(() => {
        setSearchQuery((current) => (current.trim() === urlSearch ? current : urlSearch));
    }, [urlSearch]);

    useEffect(() => {
        setUrlSearch(activeSearch);
    }, [activeSearch, setUrlSearch]);

    const { categories, reload: reloadCategories } = useCategories();
    const {
        books,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMore,
        reload: reloadBooks,
        refresh: refreshBooks,
        retry,
        replaceBook,
    } = useBooks(selectedCategory, debouncedSearch);

    // `null` = modal cerrado; `{ book: null }` = crear; `{ book }` = editar
    const [bookModal, setBookModal] = useState<{ book: Book | null } | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

    // Recarga explícita (botón "Recargar"): vuelve a la primera página con estado de carga
    const reloadAll = () => Promise.all([reloadBooks(), reloadCategories()]);

    // Tras crear o borrar, los conteos de categorías cambian; se refresca sin saltos de scroll
    const refreshAll = () => Promise.all([refreshBooks(), reloadCategories()]);

    const handleDeleteBook = async (book: Book) => {
        const result = await apiRequest<null>(`/books/${book.id}`, 'DELETE');
        setBookToDelete(null);

        if (!result.ok) {
            notifyFailure(result);

            return;
        }

        notify('success', result.message);
        await refreshAll();
    };

    // Editar sin cambiar de categoría ni de resultados de búsqueda no necesita pedir nada al servidor
    const handleBookSaved = async (saved: Book, previous: Book | null) => {
        if (previous && previous.category_id === saved.category_id && activeSearch === '') {
            replaceBook(saved);

            return;
        }

        await refreshAll();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setUrlSearch('');
        setSelectedCategory('');
    };

    const defaultCategoryId = selectedCategory || (categories[0]?.id ? String(categories[0].id) : '');

    return (
        <>
            <Head title="Gestión de Biblioteca" />

            <div className="bg-muted/40 text-foreground min-h-screen">
                <LibraryHeader
                    categoriesCount={categories.length}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    loading={loading}
                    onRefresh={reloadAll}
                    onOpenCategories={() => setIsCategoryModalOpen(true)}
                    onNewBook={() => setBookModal({ book: null })}
                />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <BookFilters categories={categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

                    <BookList
                        books={books}
                        loading={loading}
                        loadingMore={loadingMore}
                        hasMore={hasMore}
                        error={error}
                        searchTerm={activeSearch}
                        hasCategoryFilter={selectedCategory !== ''}
                        onLoadMore={loadMore}
                        onRetry={retry}
                        onEdit={(book) => setBookModal({ book })}
                        onDelete={setBookToDelete}
                        onCreate={() => setBookModal({ book: null })}
                        onClearFilters={clearFilters}
                    />
                </main>

                {bookToDelete && (
                    <ConfirmDialog
                        title="¿Eliminar libro?"
                        description={`Se eliminará "${bookToDelete.title}" de ${bookToDelete.author}. Esta acción no se puede deshacer.`}
                        confirmLabel="Eliminar"
                        onConfirm={() => handleDeleteBook(bookToDelete)}
                        onCancel={() => setBookToDelete(null)}
                    />
                )}

                {bookModal && (
                    <BookModal
                        book={bookModal.book}
                        categories={categories}
                        defaultCategoryId={defaultCategoryId}
                        onClose={() => setBookModal(null)}
                        onSaved={(saved) => handleBookSaved(saved, bookModal.book)}
                    />
                )}

                {isCategoryModalOpen && (
                    <CategoryModal
                        categories={categories}
                        onClose={() => setIsCategoryModalOpen(false)}
                        onCategoriesChanged={reloadCategories}
                        onEverythingChanged={refreshAll}
                        onCategoryDeleted={(category) => {
                            if (selectedCategory === String(category.id)) {
                                setSelectedCategory('');
                            }
                        }}
                    />
                )}

                <Toaster />
            </div>
        </>
    );
}
