import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface ConfirmDialogProps {
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void | Promise<unknown>;
    onCancel: () => void;
}

/** Confirmación para acciones destructivas con rol alertdialog y foco inicial controlado en "Cancelar". */
export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
    const [busy, setBusy] = useState(false);
    const cancelRef = useRef<HTMLButtonElement>(null);

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await onConfirm();
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
            <DialogContent
                role="alertdialog"
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    cancelRef.current?.focus();
                }}
                onEscapeKeyDown={(e) => busy && e.preventDefault()}
                onInteractOutside={(e) => busy && e.preventDefault()}
                className="max-w-md [&>button:last-child]:hidden"
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button ref={cancelRef} type="button" variant="outline" onClick={onCancel} disabled={busy}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleConfirm} disabled={busy}>
                        {busy && <Loader2 className="animate-spin" aria-hidden />}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
