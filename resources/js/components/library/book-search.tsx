import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { useId } from 'react';

interface BookSearchProps {
    value: string;
    onChange: (value: string) => void;
    autoFocus?: boolean;
    className?: string;
}

export function BookSearch({ value, onChange, autoFocus, className }: BookSearchProps) {
    // Puede haber dos instancias montadas (encabezado completo y barra móvil): cada una necesita su propio id
    const id = useId();

    return (
        <div className={cn('relative', className)}>
            <Label htmlFor={id} className="sr-only">
                Buscar libros por título, autor o año
            </Label>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" aria-hidden />
            <Input
                id={id}
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Título, autor o año"
                autoComplete="off"
                autoFocus={autoFocus}
                // El espacio del botón "limpiar" solo se reserva cuando ese botón existe
                className={cn('pl-9 [&::-webkit-search-cancel-button]:hidden', value ? 'pr-10' : 'pr-3')}
            />
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange('')}
                    aria-label="Limpiar búsqueda"
                    className="absolute top-0 right-0 h-10 w-10"
                >
                    <X aria-hidden />
                </Button>
            )}
        </div>
    );
}
