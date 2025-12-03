import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
  variant?: 'default' | 'inline' | 'icon-only';
}

export function HelpTooltip({
  content,
  side = 'top',
  className,
  iconClassName,
  variant = 'default',
}: HelpTooltipProps) {
  if (variant === 'icon-only') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-manglar-orange focus:ring-offset-2",
                iconClassName
              )}
              aria-label="Ayuda"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side={side} className="max-w-xs">
            {typeof content === 'string' ? <p>{content}</p> : content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("inline-flex items-center gap-1 text-muted-foreground cursor-help", className)}>
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent side={side} className="max-w-xs">
            {typeof content === 'string' ? <p>{content}</p> : content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-manglar-orange focus:ring-offset-2 rounded",
              className
            )}
            aria-label="Ayuda"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Ayuda</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {typeof content === 'string' ? <p>{content}</p> : content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente para tooltips informativos en formularios
export function FormHelpText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground mt-1.5", className)}>
      {children}
    </p>
  );
}

