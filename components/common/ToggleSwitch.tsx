import React from 'react';

interface ToggleSwitchProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelClassName?: string;
  className?: string; // Added className to props interface
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  labelClassName,
  className,
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  // Define base and theme-specific classes using Tailwind dark: variant
  const labelBaseClasses = "text-sm font-medium";
  const labelColorClasses = labelClassName || "text-secondary-700 dark:text-secondary-200";

  const toggleBackgroundBaseClasses = "block w-10 h-6 rounded-full transition-colors";
  const toggleBackgroundColor = checked
    ? "bg-primary-500 dark:bg-primary-600"
    : "bg-secondary-300 dark:bg-secondary-600";

  const dotBaseClasses = "dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ease-in-out";
  const dotCheckedClasses = "transform translate-x-full";

  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between cursor-pointer py-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      {...props}
    >
      <span className={`${labelBaseClasses} ${labelColorClasses}`}>{label}</span>
      <div className="relative mr-3 rtl:ml-3 rtl:mr-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          aria-checked={checked}
        />
        <div className={`${toggleBackgroundBaseClasses} ${toggleBackgroundColor}`}></div>
        <div
          className={`${dotBaseClasses} ${checked ? dotCheckedClasses : ''}`}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
