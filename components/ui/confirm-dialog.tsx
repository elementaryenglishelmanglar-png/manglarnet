import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const icons = {
    default: HelpCircle,
    destructive: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const buttonVariants = {
    default: 'default',
    destructive: 'destructive',
    warning: 'default',
    info: 'default',
  } as const;

  const iconColors = {
    default: 'text-manglar-orange',
    destructive: 'text-destructive',
    warning: 'text-manglar-yellow',
    info: 'text-manglar-orange',
  };

  const Icon = icons[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Icon className={`h-6 w-6 ${iconColors[variant]}`} />
            <DialogTitle className="text-left">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-2 whitespace-pre-line">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              variant === 'warning'
                ? 'bg-manglar-yellow hover:bg-manglar-yellow/90 text-foreground'
                : variant === 'destructive'
                ? ''
                : 'bg-manglar-orange hover:bg-manglar-orange/90'
            }
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

