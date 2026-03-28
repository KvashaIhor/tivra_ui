"use client";

import { InputHTMLAttributes, ReactNode } from 'react';

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  icon?: ReactNode;
}

export default function AccessibleInput({
  label,
  description,
  error,
  icon,
  id,
  required,
  disabled,
  className,
  ...props
}: AccessibleInputProps) {
  const inputId = id || `input-${Math.random()}`;
  const describedBy = [description && `${inputId}-desc`, error && `${inputId}-error`]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white/90 mb-2"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          {...props}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={`
            w-full px-4 py-2.5 rounded-lg
            bg-white/10 border border-white/20
            text-white placeholder-white/50
            transition-all duration-200
            focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1
            focus-visible:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            outline-none
            ${error ? 'border-rose-500/50 ring-1 ring-rose-500/20' : ''}
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
        />
      </div>

      {description && (
        <p id={`${inputId}-desc`} className="mt-1.5 text-xs text-white/50">
          {description}
        </p>
      )}

      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
