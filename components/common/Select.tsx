import React from 'react';
import { Theme } from '@/types'; // Assuming Option is also in types or defined locally

// Define Option interface locally if not from global types, or ensure it's imported
interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  containerClassName?: string;
  defaultEmptyOption?: boolean | string;
  labelClassName?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  id,
  options,
  error,
  className,
  containerClassName,
  value,
  defaultEmptyOption = "בחר...",
  labelClassName,
  ...props
}) => {
  const htmlForId = id || props.name;

  const baseSelectClasses = "block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed";
  // Assuming themed-select class handles dark mode for background/text or using direct Tailwind dark classes
  const lightThemeSelectClasses = "border-secondary-300 focus:border-primary-500 focus:ring-primary-500 text-secondary-900 bg-white";
  const darkThemeSelectClasses = "dark:bg-secondary-700 dark:border-secondary-600 dark:focus:border-primary-400 dark:focus:ring-primary-400 dark:text-secondary-100";

  const errorClasses = "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500 focus:border-red-500 dark:focus:border-red-500";
  const normalClasses = `${lightThemeSelectClasses} ${darkThemeSelectClasses}`;

  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && (
        <label
          htmlFor={htmlForId}
          className={`block text-sm font-medium mb-1 ${labelClassName || 'text-secondary-700 dark:text-secondary-300'}`}
        >
          {label}
        </label>
      )}
      <select
        id={htmlForId}
        value={value === undefined && defaultEmptyOption ? "" : value}
        className={`${baseSelectClasses} ${error ? errorClasses : normalClasses} ${className || ''}`}
        aria-required={props.required ? "true" : undefined}
        aria-invalid={error ? "true" : undefined}
        {...props}
      >
        {defaultEmptyOption && <option value="" disabled={value !== ""}>{typeof defaultEmptyOption === 'string' ? defaultEmptyOption : "בחר..."}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Select;
