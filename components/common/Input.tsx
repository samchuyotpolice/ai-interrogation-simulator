import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className, containerClassName, type = "text", labelClassName, ...props }) => {
  const htmlForId = id || props.name;

  // Default Tailwind classes for the input, including dark mode variants
  const baseInputClasses = "block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed";
  const lightThemeInputClasses = "border-secondary-300 focus:border-primary-500 focus:ring-primary-500 text-secondary-900 placeholder-secondary-400";
  const darkThemeInputClasses = "dark:bg-secondary-700 dark:border-secondary-600 dark:focus:border-primary-400 dark:focus:ring-primary-400 dark:text-secondary-100 dark:placeholder-secondary-500";

  // Classes for error state
  const errorClasses = "border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500 focus:border-red-500 dark:focus:border-red-500";
  const normalClasses = `${lightThemeInputClasses} ${darkThemeInputClasses}`; // Normal state classes combining light and dark

  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && (
        <label
          htmlFor={htmlForId}
          // Apply dark mode styling directly using Tailwind's dark: prefix
          className={`block text-sm font-medium mb-1 ${labelClassName || 'text-secondary-700 dark:text-secondary-300'}`}
        >
          {label}
        </label>
      )}
      <input
        id={htmlForId}
        type={type}
        // Combine base, error/normal, and any custom classes
        className={`${baseInputClasses} ${error ? errorClasses : normalClasses} ${className || ''}`}
        aria-required={props.required ? "true" : undefined}
        aria-invalid={error ? "true" : undefined} // Add aria-invalid if there's an error
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;
