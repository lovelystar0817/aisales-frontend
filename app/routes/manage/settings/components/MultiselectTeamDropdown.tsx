import { MultiselectDropdown } from './MultiselectDropdown';

interface MultiselectTeamDropdownProps {
  options: Array<{ id: string; name: string }>;
  selectedValues: string[] | undefined;
  onChange: (values: string[] | undefined) => void;
  placeholder: string;
  onClose?: () => void;
}

export const MultiselectTeamDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  onClose,
}: MultiselectTeamDropdownProps) => {
  return (
    <MultiselectDropdown
      options={options}
      selectedValues={selectedValues}
      onChange={onChange}
      onClose={onClose}
      placeholder={placeholder}
      allOptionLabel="All teams"
      minWidth="min-w-36"
    />
  );
};
