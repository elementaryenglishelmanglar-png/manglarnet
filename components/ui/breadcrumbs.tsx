import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon || (index === 0 ? Home : null);

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" aria-hidden="true" />
              )}
              {isLast ? (
                <span
                  className="font-medium text-foreground flex items-center gap-1.5"
                  aria-current="page"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="text-muted-foreground hover:text-manglar-orange transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-manglar-orange focus:ring-offset-2 rounded"
                  aria-label={`Ir a ${item.label}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </button>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

