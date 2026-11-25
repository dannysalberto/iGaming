import { dismissToast, pauseToast, resumeToast, useToasts, type ToastType } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, TriangleAlert, X, XCircle } from 'lucide-react';

// Colores sólidos y con contraste suficiente (≥ 4,5:1) para que se vean sobre cualquier fondo, claro u oscuro
const STYLES: Record<ToastType, { box: string; Icon: typeof CheckCircle2 }> = {
    success: { box: 'border-emerald-800 bg-emerald-700 text-white', Icon: CheckCircle2 },
    warning: { box: 'border-orange-600 bg-orange-500 text-orange-950', Icon: TriangleAlert },
    error: { box: 'border-red-800 bg-red-600 text-white', Icon: XCircle },
};

export function Toaster() {
    const toasts = useToasts();

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-4 z-[100] mx-auto flex w-[calc(100%-2rem)] max-w-md flex-col gap-2"
        >
            {toasts.map((t) => {
                const { box, Icon } = STYLES[t.type];

                return (
                    <div
                        key={t.id}
                        role={t.type === 'error' ? 'alert' : 'status'}
                        onMouseEnter={() => pauseToast(t.id)}
                        onMouseLeave={() => resumeToast(t.id, t.type)}
                        onFocus={() => pauseToast(t.id)}
                        onBlur={() => resumeToast(t.id, t.type)}
                        className={cn(
                            'animate-in fade-in slide-in-from-top-4 pointer-events-auto flex items-start gap-3 rounded-lg border p-3.5 text-sm font-medium shadow-xl duration-200',
                            box,
                        )}
                    >
                        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                        <p className="flex-1">{t.message}</p>
                        <button
                            type="button"
                            onClick={() => dismissToast(t.id)}
                            aria-label="Cerrar aviso"
                            className="-m-2 inline-flex h-10 w-10 items-center justify-center rounded-md opacity-80 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-hidden"
                        >
                            <X className="h-4 w-4" aria-hidden />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
