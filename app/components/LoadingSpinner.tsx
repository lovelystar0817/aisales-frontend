import clsx from 'clsx';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={clsx('gradient-spinner rounded-full', className)}></div>
  );
}
