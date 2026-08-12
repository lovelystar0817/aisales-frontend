import clsx from 'clsx';
import { ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder,
  onlyFirstRowDivider = false,
  clearable = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
    description?: string;
    type?: string;
    component?: any;
    tags?: string[];
    action?: {
      label: string;
      onClick: () => void;
      closeOnClick?: boolean;
    };
    image?: string;
  }[];
  placeholder: string;
  onlyFirstRowDivider?: boolean;
  clearable?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="focus:ring-0.5 focus:ring-primary-500 flex w-full min-w-[144px] items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:border-blue-500 focus:outline-none"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {clearable && selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 hover:bg-gray-100"
            >
              <XCircle className="h-4 w-4 text-gray-500" />
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="ml-4 h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="ml-4 h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      {isOpen && (
        <div
          className={clsx(
            'absolute z-10 mt-1 w-full min-w-[144px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg',
            onlyFirstRowDivider ? 'py-1' : '',
          )}
        >
          {options.length > 0 ? (
            options.map((option, index) => (
              <div key={option.value}>
                {option.type === 'custom' ? (
                  option.component
                ) : (
                  <div
                    className={clsx(
                      'mx-2 flex',
                      index === options.length - 1
                        ? ''
                        : onlyFirstRowDivider && index !== 0
                          ? ''
                          : 'border-b border-gray-200',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={clsx(
                        'block flex w-full flex-1 rounded p-2 text-left text-sm text-gray-900 hover:bg-gray-50',
                        !onlyFirstRowDivider ? 'my-2' : 'my-0.5',
                      )}
                    >
                      {option.image && (
                        <img
                          src={option.image}
                          alt={option.label}
                          className="mr-4 h-10 w-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <span className="block">{option.label}</span>
                        {option.description && (
                          <span className="text-sm text-gray-500">
                            {option.description}
                          </span>
                        )}
                        {option.tags && option.tags.length > 0 && (
                          <div className="mt-1 flex gap-2">
                            {option.tags.map((tag) => (
                              <div
                                key={tag}
                                className="rounded border border-gray-200 px-2 py-[2px] text-xs text-gray-500"
                              >
                                {tag}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                    {option.action && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!option.action) return;

                          option.action.onClick();
                          if (option.action.closeOnClick !== false) {
                            setIsOpen(false);
                          }
                        }}
                        className={clsx(
                          'flex cursor-pointer items-center px-3 text-sm font-semibold text-blue-500',
                        )}
                      >
                        <span className="block">{option.action.label}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center p-4 text-sm text-gray-500">
              No options
            </div>
          )}
        </div>
      )}
    </div>
  );
};
