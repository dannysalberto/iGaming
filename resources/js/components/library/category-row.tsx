import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest, notify, notifyFailure } from '@/lib/api';
import type { Category } from '@/types/library';
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

interface CategoryRowProps {
    category: Category;
    editing: boolean;
    onStartEdit: () => void;
    onStopEdit: () => void;
    /** Se llama tras renombrar con éxito: el nombre cambia también en cada libro de la categoría. */
    onRenamed: () => void | Promise<unknown>;
    onRequestDelete: () => void;
    onBusyChange: (busy: boolean) => void;
}

const pluralBooks = (count: number) => (count === 1 ? 'libro' : 'libros');

export function CategoryRow({ category, editing, onStartEdit, onStopEdit, onRenamed, onRequestDelete, onBusyChange }: CategoryRowProps) {
    return (
        <li className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            {editing ? (
                <CategoryEditForm category={category} onCancel={onStopEdit} onRenamed={onRenamed} onBusyChange={onBusyChange} />
            ) : (
                <CategoryDisplay category={category} onStartEdit={onStartEdit} onRequestDelete={onRequestDelete} />
            )}
        </li>
    );
}

interface CategoryDisplayProps {
    category: Category;
    onStartEdit: () => void;
    onRequestDelete: () => void;
}

function CategoryDisplay({ category, onStartEdit, onRequestDelete }: CategoryDisplayProps) {
    const booksCount = category.books_count ?? 0;

    return (
        <>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-medium break-words">{category.name}</span>
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs whitespace-nowrap tabular-nums">
                    {booksCount} {pluralBooks(booksCount)}
                </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                <Button type="button" size="sm" variant="outline" aria-label={`Editar categoría ${category.name}`} onClick={onStartEdit}>
                    <Pencil aria-hidden />
                    Editar
                </Button>

                {booksCount > 0 ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span tabIndex={0} className="inline-flex rounded-md">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled
                                    className="text-muted-foreground pointer-events-none"
                                    aria-label={`No se puede eliminar ${category.name} porque tiene ${booksCount} ${pluralBooks(booksCount)} asociados`}
                                >
                                    <Trash2 aria-hidden />
                                    Eliminar
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            No se puede eliminar: tiene {booksCount} {booksCount === 1 ? 'libro asociado' : 'libros asociados'}
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Eliminar categoría ${category.name}`}
                        onClick={onRequestDelete}
                    >
                        <Trash2 aria-hidden />
                        Eliminar
                    </Button>
                )}
            </div>
        </>
    );
}

interface CategoryEditFormProps {
    category: Category;
    onCancel: () => void;
    onRenamed: () => void | Promise<unknown>;
    onBusyChange: (busy: boolean) => void;
}

/** Se monta solo mientras se edita, así el campo siempre arranca con el nombre actual. */
function CategoryEditForm({ category, onCancel, onRenamed, onBusyChange }: CategoryEditFormProps) {
    const uid = useId();
    const [name, setName] = useState(category.name);
    const [error, setError] = useState<string>();
    const [updating, setUpdating] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (updating) {
            return;
        }
        setUpdating(true);
        onBusyChange(true);
        setError(undefined);

        const result = await apiRequest<Category>(`/categories/${category.id}`, 'PUT', { name });
        setUpdating(false);
        onBusyChange(false);

        if (!result.ok) {
            const fieldError = result.errors?.name?.[0];
            if (fieldError) {
                setError(fieldError);
                notify('warning', fieldError);
            } else {
                notifyFailure(result);
            }

            return;
        }

        notify('success', result.message);
        await onRenamed();
    };

    return (
        <form onSubmit={handleSubmit} className="w-full" noValidate>
            <div className="flex w-full flex-wrap items-center gap-2">
                <Label htmlFor={`${uid}-edit`} className="sr-only">
                    Nombre de la categoría
                </Label>
                <Input
                    id={`${uid}-edit`}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' && !updating) {
                            // Escape cancela la edición sin cerrar el modal que contiene el formulario
                            e.preventDefault();
                            e.stopPropagation();
                            onCancel();
                        }
                    }}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${uid}-edit-error` : undefined}
                    disabled={updating}
                    autoFocus
                    className="w-full min-w-0 sm:w-auto sm:flex-1"
                />
                <Button type="submit" size="sm" disabled={updating}>
                    {updating ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                    Guardar
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={updating} onClick={onCancel}>
                    <X aria-hidden />
                    Cancelar
                </Button>
            </div>
            {error && (
                <p id={`${uid}-edit-error`} className="text-destructive mt-1.5 text-xs">
                    {error}
                </p>
            )}
        </form>
    );
}
