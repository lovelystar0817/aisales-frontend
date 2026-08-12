import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MultiselectDropdown,
  type MultiselectOption,
} from './MultiselectDropdown';

describe('MultiselectDropdown', () => {
  const mockOptions: MultiselectOption[] = [
    { id: 'option-1', name: 'Option 1' },
    { id: 'option-2', name: 'Option 2' },
    { id: 'option-3', name: 'Option 3' },
  ];

  const mockOptionsWithDescriptions: MultiselectOption[] = [
    {
      id: 'role-1',
      name: 'Superadmin',
      description: 'Full access to all features',
    },
    { id: 'role-2', name: 'Admin', description: 'Admin access' },
    { id: 'role-3', name: 'User', description: 'Basic user access' },
  ];

  const mockOnChange = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with placeholder when no selection', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      expect(screen.getByText('All options')).toBeInTheDocument();
    });

    it('should render with custom allOptionLabel', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All roles"
        />,
      );

      expect(screen.getByText('All roles')).toBeInTheDocument();
    });

    it('should render with default allOptionLabel when not provided', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
        />,
      );

      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should display single option name when one is selected', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should display count when multiple options selected', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1', 'option-2']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should apply custom minWidth', () => {
      const { container } = render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          minWidth="min-w-64"
        />,
      );

      const dropdown = container.querySelector('.min-w-64');
      expect(dropdown).toBeInTheDocument();
    });

    it('should apply default minWidth when not provided', () => {
      const { container } = render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
        />,
      );

      const dropdown = container.querySelector('.min-w-36');
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Dropdown Opening and Closing', () => {
    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <MultiselectDropdown
            options={mockOptions}
            selectedValues={undefined}
            onChange={mockOnChange}
            placeholder="Select options"
            allOptionLabel="All options"
          />
        </div>,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Option 1')).toBeInTheDocument();

      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);

      await waitFor(() => {
        const option1Elements = screen.queryAllByText('Option 1');
        expect(option1Elements.length).toBe(0);
      });
    });

    it('should NOT close dropdown when clicking on an option', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const allOptions = screen.queryAllByText('Option 1');
      expect(allOptions.length).toBeGreaterThan(0);

      await user.click(allOptions[0]);

      await waitFor(() => {
        // Dropdown should still be open - check for Option 2 and 3
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.getByText('Option 3')).toBeInTheDocument();
      });
    });

    it('should toggle dropdown when clicking button multiple times', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');

      await user.click(button);
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      await user.click(button);
      await waitFor(() => {
        const option1Elements = screen.queryAllByText('Option 1');
        expect(option1Elements.length).toBe(0);
      });
    });
  });

  describe('Option Selection', () => {
    it('should call onChange with undefined when "All" is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const allOption = screen.getByText('All options');
      await user.click(allOption);

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });

    it('should call onChange with selected option when clicking an option', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const option1 = screen.getByText('Option 1');
      await user.click(option1);

      expect(mockOnChange).toHaveBeenCalledWith(['option-1']);
    });

    it('should add option to selection when clicking unselected option', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const option2 = screen.getByText('Option 2');
      await user.click(option2);

      expect(mockOnChange).toHaveBeenCalledWith(['option-1', 'option-2']);
    });

    it('should remove option from selection when clicking selected option', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1', 'option-2']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const checkboxes = screen.getAllByRole('checkbox');
      const option1Checkbox = checkboxes.find((cb) => cb.getAttribute('checked') !== null);

      const option1 = screen.getByText('Option 1');
      await user.click(option1);

      expect(mockOnChange).toHaveBeenCalledWith(['option-2']);
    });

    it('should call onChange with undefined when last option is deselected', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const allOption1Elements = screen.getAllByText('Option 1');
      // Click the one in the dropdown list (not in the button)
      await user.click(allOption1Elements[allOption1Elements.length - 1]);

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });

    it('should allow selecting multiple options', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const option1 = screen.getByText('Option 1');
      await user.click(option1);

      expect(mockOnChange).toHaveBeenCalledWith(['option-1']);

      mockOnChange.mockClear();

      const option2 = screen.getByText('Option 2');
      await user.click(option2);

      expect(mockOnChange).toHaveBeenCalledWith(['option-2']);
    });
  });

  describe('Checkbox State', () => {
    it('should show "All" checkbox as checked when selectedValues is undefined', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // "All" checkbox
    });

    it('should show "All" checkbox as unchecked when specific options selected', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeChecked(); // "All" checkbox
    });

    it('should show correct checkboxes checked for selected options', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1', 'option-3']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeChecked(); // "All" checkbox
      expect(checkboxes[1]).toBeChecked(); // Option 1
      expect(checkboxes[2]).not.toBeChecked(); // Option 2
      expect(checkboxes[3]).toBeChecked(); // Option 3
    });
  });

  describe('Options with Descriptions', () => {
    it('should render option descriptions when provided', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptionsWithDescriptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select role"
          allOptionLabel="All roles"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Full access to all features')).toBeInTheDocument();
      expect(screen.getByText('Admin access')).toBeInTheDocument();
      expect(screen.getByText('Basic user access')).toBeInTheDocument();
    });

    it('should not render description section when description is not provided', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const descriptions = screen.queryByText(
        (_content, element) =>
          element?.tagName === 'SPAN' &&
          element.className.includes('text-xs') &&
          element.className.includes('text-gray-500'),
      );
      expect(descriptions).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={[]}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(1); // Only "All" checkbox
    });

    it('should handle selectedValues with non-existent option IDs', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['non-existent-id']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      expect(screen.getByText('Select options')).toBeInTheDocument();
    });

    it('should handle selecting all options individually', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const option1 = screen.getByText('Option 1');
      await user.click(option1);

      expect(mockOnChange).toHaveBeenCalledWith(['option-1']);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have checkboxes for all options when dropdown is open', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(4); // 1 for "All" + 3 options
    });

    it('should toggle chevron icon when opening/closing', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      const chevron = container.querySelector('.rotate-180');
      expect(chevron).not.toBeInTheDocument();

      await user.click(button);

      const rotatedChevron = container.querySelector('.rotate-180');
      expect(rotatedChevron).toBeInTheDocument();
    });
  });

  describe('Display Text Logic', () => {
    it('should show allOptionLabel when selectedValues is undefined', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All items"
        />,
      );

      expect(screen.getByText('All items')).toBeInTheDocument();
    });

    it('should show option name when only one option is selected', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-2']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should show count when two options are selected', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1', 'option-2']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should show count when all options are selected', () => {
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={['option-1', 'option-2', 'option-3']}
          onChange={mockOnChange}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      expect(screen.getByText('3 selected')).toBeInTheDocument();
    });
  });

  describe('onClose Callback', () => {
    it('should call onClose when clicking outside the dropdown', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <MultiselectDropdown
            options={mockOptions}
            selectedValues={undefined}
            onChange={mockOnChange}
            onClose={mockOnClose}
            placeholder="Select options"
            allOptionLabel="All options"
          />
        </div>,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnClose).not.toHaveBeenCalled();

      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onClose when clicking the button to close dropdown', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          onClose={mockOnClose}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');

      // Open dropdown
      await user.click(button);
      expect(mockOnClose).not.toHaveBeenCalled();

      // Close dropdown by clicking button again
      await user.click(button);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should work without onClose callback', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside element</div>
          <MultiselectDropdown
            options={mockOptions}
            selectedValues={undefined}
            onChange={mockOnChange}
            placeholder="Select options"
            allOptionLabel="All options"
          />
        </div>,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(screen.getByText('Option 1')).toBeInTheDocument();

      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);

      await waitFor(() => {
        const option1Elements = screen.queryAllByText('Option 1');
        expect(option1Elements.length).toBe(0);
      });
    });

    it('should NOT call onClose when selecting an option', async () => {
      const user = userEvent.setup();
      render(
        <MultiselectDropdown
          options={mockOptions}
          selectedValues={undefined}
          onChange={mockOnChange}
          onClose={mockOnClose}
          placeholder="Select options"
          allOptionLabel="All options"
        />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const allOptions = screen.queryAllByText('Option 1');
      await user.click(allOptions[0]);

      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledWith(['option-1']);
    });
  });
});
