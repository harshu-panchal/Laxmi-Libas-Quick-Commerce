import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  as?: 'input' | 'textarea';
  rows?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  as = 'input',
  className = '',
  ...props
}) => {
  const Component = as as any;
  const baseInputStyles = 'w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all outline-none text-neutral-800 placeholder:text-neutral-400';
  const errorStyles = error ? 'border-red-500 bg-red-50/10' : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-semibold text-neutral-700 ml-1">
        {label}
      </label>
      <Component
        className={`${baseInputStyles} ${errorStyles}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium ml-1">{error}</p>}
    </div>
  );
};
