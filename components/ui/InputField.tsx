import React from 'react';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/lib/utils';

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  as?: 'textarea' | 'select';
  rows?: number;
  disabled?: boolean;
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  required = false, 
  as, 
  rows, 
  disabled, 
  children,
  placeholder,
  className
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {as === 'textarea' ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          rows={rows}
          placeholder={placeholder}
          className="min-h-[80px]"
        />
      ) : as === 'select' ? (
        <Select value={value} onValueChange={(val) => {
          const event = {
            target: { name, value: val }
          } as React.ChangeEvent<HTMLSelectElement>;
          onChange(event);
        }}>
          <SelectTrigger id={name} disabled={disabled} className="w-full">
            <SelectValue placeholder={placeholder || `Selecciona ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type === 'option') {
                return (
                  <SelectItem key={child.props.value} value={child.props.value}>
                    {child.props.children}
                  </SelectItem>
                );
              }
              return child;
            })}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};
