import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, notify, notifyFailure } from '@/lib/api';
import type { Category } from '@/types/library';
import { FolderPlus, Loader2 } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

interface CategoryCreateFormProps {
    onCreated: () => void | Promise<unknown>;
    onBusyChange: (busy: boolean) => void;
}

export function CategoryCreateForm({ onCreated, onBusyChange }: CategoryCreateFormProps) {
    const uid = useId();
    const [name, setName] = useState('');
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        onBusyChange(true);
        setError(undefined);

        const result = await apiRequest<Category>('/categories', 'POST', { name });
        setSubmitting(false);
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

        setName('');
        notify('success', result.message);
        await onCreated();
    };

    return (
        <form onSubmit={handleSubmit} className="mb-5" noValidate>
            <Label htmlFor={`${uid}-new`} className="mb-1.5 block">
                Nueva categoría
            </Label>
            <div className="flex gap-2">
                <Input
                    id={`${uid}-new`}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre único de categoría..."
                    aria-invalid={!!error}
                    aria-describedby={error ? `${uid}-new-error` : undefined}
                    autoComplete="off"
                    className="min-w-0 flex-1"
                />
                <Button type="submit" disabled={submitting} className="shrink-0">
                    {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <FolderPlus aria-hidden />}
                    Crear
                </Button>
            </div>
            {error && (
                <p id={`${uid}-new-error`} className="text-destructive mt-1.5 text-xs">
                    {error}
                </p>
            )}
        </form>
    );
}
