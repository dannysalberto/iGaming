import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ReactNode } from 'react';

interface ModalProps {
    title: string;
    description?: string;
    preventClose?: boolean;
    onClose: () => void;
    children: ReactNode;
}

/**
 * Basado en Radix Dialog: atrapa el foco, cierra con Escape, devuelve el foco al disparador y expone role="dialog".
 * Se monta solo mientras está abierto.
 */
export function Modal({ title, description, preventClose = false, onClose, children }: ModalProps) {
    return (
        <Dialog open onOpenChange={(open) => !open && !preventClose && onClose()}>
            <DialogContent
                onEscapeKeyDown={(e) => preventClose && e.preventDefault()}
                onInteractOutside={(e) => preventClose && e.preventDefault()}
                className="max-h-[calc(100dvh-2rem)] max-w-lg gap-0 overflow-x-hidden overflow-y-auto p-0"
            >
                <DialogHeader className="border-b px-6 py-4 pr-12">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className={description ? undefined : 'sr-only'}>{description ?? title}</DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
