import { TooltipProvider } from '@/components/ui/tooltip';
import { apiRequest, notify, notifyFailure } from '@/lib/api';
import type { Category } from '@/types/library';
import { useState } from 'react';
import { CategoryCreateForm } from './category-create-form';
import { CategoryRow } from './category-row';
import { ConfirmDialog } from './confirm-dialog';
import { Modal } from './modal';

interface CategoryModalProps {
    categories: Category[];
    onClose: () => void;
    /** Recarga solo las categorías (por ejemplo, tras crear o borrar una). */
    onCategoriesChanged: () => void | Promise<unknown>;
    /** Recarga categorías y libros (por ejemplo, tras renombrar una, porque cambia el nombre en cada libro). */
    onEverythingChanged: () => void | Promise<unknown>;
    onCategoryDeleted: (category: Category) => void;
}

export function CategoryModal({ categories, onClose, onCategoriesChanged, onEverythingChanged, onCategoryDeleted }: CategoryModalProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
    // Mientras un formulario hijo guarda, el modal no debe poder cerrarse
    const [busy, setBusy] = useState(false);

    const handleRenamed = async () => {
        setEditingId(null);
        await onEverythingChanged();
    };

    const handleDelete = async (category: Category) => {
        const result = await apiRequest<null>(`/categories/${category.id}`, 'DELETE');
        setPendingDelete(null);

        if (!result.ok) {
            notifyFailure(result);

            return;
        }

        onCategoryDeleted(category);
        notify('success', result.message);
        await onCategoriesChanged();
    };

    return (
        <>
            <Modal
                title="Gestión de categorías"
                description="Nombre único requerido. No se permite eliminar categorías con libros asociados."
                preventClose={busy}
                onClose={onClose}
            >
                <div className="p-4 sm:p-6">
                    <CategoryCreateForm onCreated={onCategoriesChanged} onBusyChange={setBusy} />

                    {categories.length === 0 ? (
                        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                            Aún no hay categorías registradas.
                        </p>
                    ) : (
                        <TooltipProvider delayDuration={150}>
                            <ul className="max-h-72 divide-y overflow-x-hidden overflow-y-auto rounded-xl border">
                                {categories.map((category) => (
                                    <CategoryRow
                                        key={category.id}
                                        category={category}
                                        editing={editingId === category.id}
                                        onStartEdit={() => setEditingId(category.id)}
                                        onStopEdit={() => setEditingId(null)}
                                        onRenamed={handleRenamed}
                                        onRequestDelete={() => setPendingDelete(category)}
                                        onBusyChange={setBusy}
                                    />
                                ))}
                            </ul>
                        </TooltipProvider>
                    )}
                </div>
            </Modal>

            {pendingDelete && (
                <ConfirmDialog
                    title="¿Eliminar categoría?"
                    description={`Se eliminará "${pendingDelete.name}". Esta acción no se puede deshacer.`}
                    confirmLabel="Eliminar"
                    onConfirm={() => handleDelete(pendingDelete)}
                    onCancel={() => setPendingDelete(null)}
                />
            )}
        </>
    );
}
