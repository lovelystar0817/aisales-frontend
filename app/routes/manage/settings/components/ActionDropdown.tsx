import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { cn } from '~/util/utils';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

interface ActionItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  className?: string;
  tooltip?: string;
  tooltipClassName?: string;
}

interface ActionDropdownProps {
  actions: ActionItem[];
  trigger?: React.ReactNode;
}

export function ActionDropdown({ actions, trigger }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = (action: ActionItem) => {
    if (!action.disabled) {
      action.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {trigger ? (
          trigger
        ) : (
          <button className="rounded-sm p-[3px] hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none">
            <EllipsisHorizontalIcon className="h-6 w-6 text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="ring-opacity-5 absolute top-[-40px] right-[-24px] z-10 mt-2 min-w-24 rounded-md border border-gray-200 bg-white p-1">
          {actions.map((action, index) => {
            const Icon = action.icon;

            return (
              <React.Fragment key={index}>
                {index > 0 && <div className="m-1 border-b border-gray-200" />}
                <div className="group relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(action);
                    }}
                    disabled={action.disabled}
                    className={clsx(
                      'flex w-full items-center px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
                      action.variant === 'danger'
                        ? 'text-red-600'
                        : 'text-gray-700',
                      action.className ?? '',
                    )}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </button>

                  {action.tooltip && (
                    <div
                      className={cn(
                        'pointer-events-none invisible absolute top-7 right-10 z-50 mt-1 ml-2 w-[260px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs whitespace-normal text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100',
                        action.tooltipClassName ?? '',
                      )}
                    >
                      {action.tooltip}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
