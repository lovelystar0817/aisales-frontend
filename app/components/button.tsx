import React from 'react';
import { cn } from '~/util/utils';

interface ButtonProps {
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'custom' | 'secondary';
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'px-2.5 py-1.5 gap-x-1.5',
  md: 'px-3 py-2 gap-x-1.5',
  lg: 'px-3.5 py-2.5 gap-x-2',
};

const variantClasses = {
  primary: 'bg-primary-500 text-white hover:bg-primary-400',
  secondary: 'bg-primary-500/10 text-primary-500 hover:bg-primary-500/20',
  ghost: 'bg-transparent text-gray-500 hover:bg-gray-100',
  custom: '', // Custom variant with no default styles
};

export function Button({
  size = 'md',
  icon,
  children,
  className,
  onClick,
  disabled,
  variant = 'primary',
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-full text-center text-sm shadow-xs',
        'focus-visible:outline-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && (
        <span aria-hidden="true" className="-ml-0.5 size-5">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
