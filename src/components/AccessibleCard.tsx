"use client";

import { ReactNode } from 'react';

interface AccessibleCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  footer?: ReactNode;
  role?: string;
  ariaLabel?: string;
  className?: string;
}

export default function AccessibleCard({
  children,
  title,
  subtitle,
  header,
  footer,
  role,
  ariaLabel,
  className,
}: AccessibleCardProps) {
  return (
    <article
      role={role}
      aria-label={ariaLabel}
      className={`
        card
        bg-white/5 backdrop-blur-md
        border border-white/10
        rounded-xl p-6
        transition-all duration-300
        hover:bg-white/10 hover:border-white/20
        hover:shadow-elevation-2
        outline-none focus-within:ring-2 focus-within:ring-rose-500 focus-within:ring-offset-1
        ${className}
      `}
    >
      {header && (
        <div className="mb-4 pb-4 border-b border-white/10">
          {header}
        </div>
      )}

      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            {title}
            {subtitle && (
              <p className="text-sm text-white/60 font-normal mt-1">
                {subtitle}
              </p>
            )}
          </h3>
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>

      {footer && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {footer}
        </div>
      )}
    </article>
  );
}
