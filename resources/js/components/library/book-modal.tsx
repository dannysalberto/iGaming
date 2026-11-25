import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, notify, notifyFailure } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Book, Category, FieldErrors } from '@/types/library';
import { Loader2, Save } from 'lucide-react';
import { useId, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { Modal } from './modal';

interface BookModalProps {
    book: Book | null;
    categories: Category[];
    defaultCategoryId: string;
    onClose: () => void;
    /** Recibe el libro tal como quedó guardado en el servidor. */
    onSaved: (saved: Book) => void | Promise<unknown>;
}

interface BookForm {
    title: string;
    author: string;
    description: string;
    published_year: string;
    category_id: string;
}

const controlClass =
    'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden aria-[invalid=true]:border-destructive';

interface FieldProps {
    id: string;
    label: string;
    required?: boolean;
    optional?: boolean;
    error?: string;
    /** Recibe las props de accesibilidad (id, aria-invalid, aria-describedby) que debe llevar el control. */
    children: (a11y: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; 'aria-required'?: boolean }) => ReactElement;
}

function Field({ id, label, required, optional, error, children }: FieldProps) {
    const errorId = `${id}-error`;

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>
                {label}
                {required && (
                    <span className="text-destructive" aria-hidden>
                        {' '}
                        *
                    </span>
                )}
                {optional && <span className="text-muted-foreground text-xs font-normal"> (opcional)</span>}
            </Label>
            {children({ id, 'aria-invalid': !!error, 'aria-describedby': error ? errorId : undefined, 'aria-required': required })}
            {error && (
                <p id={errorId} className="text-destructive text-xs">
                    {error}
                </p>
            )}
        </div>
    );
}

function initialForm(book: Book | null, defaultCategoryId: string): BookForm {
    if (book) {
        return {
            title: book.title,
            author: book.author,
            description: book.description ?? '',
            published_year: String(book.published_year),
            category_id: String(book.category_id),
        };
    }

    return {
        title: '',
        author: '',
        description: '',
        published_year: new Date().getFullYear().toString(),
        category_id: defaultCategoryId,
    };
}

/**
 * Se monta solo mientras está abierto, así el formulario siempre arranca limpio (o con los datos del libro).
 */
export function BookModal({ book, categories, defaultCategoryId, onClose, onSaved }: BookModalProps) {
    const uid = useId();
    const formRef = useRef<HTMLFormElement>(null);
    const [form, setForm] = useState<BookForm>(() => initialForm(book, defaultCategoryId));
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const bind = (name: keyof BookForm) => ({
        value: form[name],
        onChange: (e: { target: { value: string } }) => setForm((prev) => ({ ...prev, [name]: e.target.value })),
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        const result = await apiRequest<Book>(book ? `/books/${book.id}` : '/books', book ? 'PUT' : 'POST', {
            title: form.title,
            author: form.author,
            description: form.description || null,
            published_year: form.published_year ? Number(form.published_year) : null,
            category_id: form.category_id ? Number(form.category_id) : null,
        });
        setSubmitting(false);

        if (!result.ok) {
            if (result.errors) {
                setErrors(result.errors);
                notify('warning', 'Revisa los campos marcados en el formulario.');
                requestAnimationFrame(() => {
                    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
                });
            } else {
                notifyFailure(result);
            }

            return;
        }

        notify('success', result.message);
        onClose();
        await onSaved(result.data);
    };

    return (
        <Modal title={book ? `Editar libro #${book.id}` : 'Registrar nuevo libro'} preventClose={submitting} onClose={onClose}>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
                <Field id={`${uid}-title`} label="Título" required error={errors.title?.[0]}>
                    {(a11y) => <Input type="text" {...a11y} {...bind('title')} placeholder="Mínimo 3 caracteres" autoComplete="off" />}
                </Field>

                <Field id={`${uid}-author`} label="Autor" required error={errors.author?.[0]}>
                    {(a11y) => <Input type="text" {...a11y} {...bind('author')} placeholder="Ej. Gabriel García Márquez" autoComplete="off" />}
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id={`${uid}-year`} label="Año de publicación" required error={errors.published_year?.[0]}>
                        {(a11y) => <Input type="number" inputMode="numeric" {...a11y} {...bind('published_year')} placeholder="Ej. 1967" />}
                    </Field>

                    <Field id={`${uid}-category`} label="Categoría" required error={errors.category_id?.[0]}>
                        {(a11y) => (
                            <select {...a11y} {...bind('category_id')} className={cn(controlClass, 'h-10')}>
                                <option value="">Seleccione una categoría...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </Field>
                </div>

                <Field id={`${uid}-description`} label="Descripción" optional error={errors.description?.[0]}>
                    {(a11y) => (
                        <textarea
                            rows={3}
                            {...a11y}
                            {...bind('description')}
                            placeholder="Resumen o sinopsis del libro..."
                            className={controlClass}
                        />
                    )}
                </Field>

                <div className="flex items-center justify-end gap-2.5 border-t pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
                        {submitting ? 'Guardando...' : book ? 'Actualizar libro' : 'Crear libro'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
