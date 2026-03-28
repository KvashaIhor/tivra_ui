"use client";

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ariaLabel?: string;
}

export default function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  ariaLabel,
  disabled,
  className,
  ...props
}: AccessibleButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'text-white/70 hover:text-white hover:bg-white/10',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      disabled={loading || disabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`
        relative flex items-center justify-center gap-2
        rounded-lg font-medium transition-all duration-200
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-500
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'invisible' : 'visible'}>{children}</span>
    </button>
  );
}
