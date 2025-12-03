import React from 'react';
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimisticButtonProps extends ButtonProps {
  isOptimistic?: boolean;
  optimisticText?: string;
  children: React.ReactNode;
}

/**
 * Botón que muestra feedback inmediato durante operaciones optimistas
 */
export function OptimisticButton({
  isOptimistic = false,
  optimisticText,
  children,
  className,
  disabled,
  ...props
}: OptimisticButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || isOptimistic}
      className={cn(
        "relative",
        isOptimistic && "opacity-75 cursor-wait",
        className
      )}
    >
      {isOptimistic ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {optimisticText || children}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}

