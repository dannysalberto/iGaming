import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleDropdown({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const getCurrentIcon = () => {
        switch (appearance) {
            case 'dark':
                return <Moon aria-hidden />;
            case 'light':
                return <Sun aria-hidden />;
            default:
                return <Monitor aria-hidden />;
        }
    };

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Cambiar tema">
                        {getCurrentIcon()}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={appearance} onValueChange={(value) => updateAppearance(value as Appearance)}>
                        <DropdownMenuRadioItem value="light">
                            <span className="flex items-center gap-2">
                                <Sun className="h-4 w-4" aria-hidden />
                                Claro
                            </span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                            <span className="flex items-center gap-2">
                                <Moon className="h-4 w-4" aria-hidden />
                                Oscuro
                            </span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="system">
                            <span className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" aria-hidden />
                                Sistema
                            </span>
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
