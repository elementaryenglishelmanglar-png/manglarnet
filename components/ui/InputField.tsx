'use client';

import React from 'react';

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
  children 
}) => {
  const commonProps = {
    id: name,
    name: name,
    value: value,
    onChange: onChange,
    required: required,
    disabled: disabled,
    className: "mt-1 block w-full px-4 py-3 border border-apple-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-apple text-base placeholder:text-apple-gray disabled:bg-apple-gray-light disabled:cursor-not-allowed",
  };
  
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-apple-gray-dark mb-2">
        {label} {required && <span className="text-apple-red">*</span>}
      </label>
      {as === 'textarea'
        ? <textarea {...commonProps} rows={rows} className={`${commonProps.className} resize-y`}></textarea>
        : as === 'select'
        ? <select {...commonProps}>{children}</select>
        : <input {...commonProps} type={type} />
      }
    </div>
  );
};

