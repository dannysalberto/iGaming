import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { router } from '@inertiajs/react';
import { DoorOpen, Layers, Monitor, Moon, MoreHorizontal, RefreshCw, Sun } from 'lucide-react';

interface LibraryMenuProps {
    email: string;
    categoriesCount: number;
    loading: boolean;
    onRefresh: () => void;
    onOpenCategories: () => void;
}

const THEMES: { value: Appearance; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: 'Claro', Icon: Sun },
    { value: 'dark', label: 'Oscuro', Icon: Moon },
    { value: 'system', label: 'Sistema', Icon: Monitor },
];

/**
 * Menú de acciones secundarias para pantallas pequeñas: agrupa lo que no cabe en el encabezado
 * (categorías, apariencia y cierre de sesión). En pantallas grandes esas acciones van como botones.
 */
export function LibraryMenu({ email, categoriesCount, loading, onRefresh, onOpenCategories }: LibraryMenuProps) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        // `modal={false}`: al abrir un diálogo desde el menú, Radix no deja el cuerpo bloqueado ni roba el foco
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="Más opciones">
                    <MoreHorizontal aria-hidden />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-muted-foreground truncate text-xs font-normal">{email}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={onOpenCategories}>
                    <Layers className="h-4 w-4" aria-hidden />
                    <span className="flex-1">Categorías</span>
                    <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs tabular-nums">{categoriesCount}</span>
                </DropdownMenuItem>

                <DropdownMenuItem disabled={loading} onSelect={onRefresh}>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Recargar listado
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">Apariencia</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={appearance} onValueChange={(value) => updateAppearance(value as Appearance)}>
                    {THEMES.map(({ value, label, Icon }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                            <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" aria-hidden />
                                {label}
                            </span>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => router.post(route('logout'))}>
                    <DoorOpen className="h-4 w-4" aria-hidden />
                    Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
