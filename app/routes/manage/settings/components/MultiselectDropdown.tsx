import { ChevronDownIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface MultiselectOption {
  id: string;
  name: string;
  description?: string;
}

interface MultiselectDropdownProps {
  options: MultiselectOption[];
  selectedValues: string[] | undefined;
  onChange: (values: string[] | undefined) => void;
  placeholder: string;
  allOptionLabel?: string;
  minWidth?: string;
  dropdownWidth?: string;
  onClose?: () => void;
}

export const MultiselectDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  allOptionLabel = 'All',
  minWidth = 'min-w-36',
  dropdownWidth = 'w-full',
  onClose,
}: MultiselectDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleToggle = (optionId: string) => {
    if (optionId === 'all') {
      // If "all" is clicked, always set to undefined (representing all options)
      onChange(undefined);
    } else {
      // If a specific option is clicked
      const currentSelection = selectedValues || [];

      let newSelection: string[];

      if (currentSelection.includes(optionId)) {
        // Remove the option if it's already selected
        newSelection = currentSelection.filter((id) => id !== optionId);
      } else {
        // Add the option if it's not selected
        newSelection = [...currentSelection, optionId];
      }

      // If no selections remain, default to "all" (undefined)
      if (newSelection.length === 0) {
        onChange(undefined);
      } else {
        onChange(newSelection);
      }
    }
  };

  const getDisplayText = () => {
    if (selectedValues === undefined) {
      return allOptionLabel;
    }
    if (selectedValues.length === 1) {
      const option = options.find((opt) => opt.id === selectedValues[0]);
      return option?.name || placeholder;
    }
    return `${selectedValues.length} selected`;
  };

  // "All" is selected when selectedValues is undefined
  const isAllSelected = selectedValues === undefined;

  const handleToggleDropdown = () => {
    if (isOpen) {
      onClose?.();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${minWidth}`} ref={containerRef}>
      <button
        type="button"
        className="relative w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-left text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        onClick={handleToggleDropdown}
      >
        <span className="block truncate">{getDisplayText()}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className={`ring-opacity-5 absolute z-10 mt-1 max-h-60 ${dropdownWidth} overflow-auto rounded-md bg-white py-1 text-base shadow-md ring-1 ring-gray-300 focus:outline-none`}>
          {/* Add "All" option */}
          <div
            key="all"
            className="relative cursor-pointer py-2 pr-9 pl-3 select-none hover:bg-gray-50"
            onClick={() => handleToggle('all')}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() => {}} // Controlled by onClick
                className="mr-3 h-4 w-4 rounded border-gray-300 accent-blue-600"
              />
              <div className="flex flex-col">
                <span className="block">{allOptionLabel}</span>
              </div>
            </div>
          </div>

          {/* Individual options */}
          {options.map((option) => {
            const isChecked = selectedValues?.includes(option.id) || false;

            return (
              <div
                key={option.id}
                className="relative cursor-pointer border-t border-gray-200 py-2 pr-9 pl-3 select-none hover:bg-gray-50"
                onClick={() => handleToggle(option.id)}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Controlled by onClick
                    className="mr-3 h-4 w-4 flex-shrink-0 rounded border-gray-300 accent-blue-600"
                  />
                  <div className="flex flex-col">
                    <span className="block">{option.name}</span>
                    {option.description && (
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
