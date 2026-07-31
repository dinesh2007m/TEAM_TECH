import React, { useState } from 'react';
import { Search, X, Command } from 'lucide-react';
import { cn } from '../../utils/cn';

export const SearchBar = ({
  placeholder = 'Search threat nodes, CVEs, logs, digital twin assets...',
  value: externalValue,
  onChange,
  onClear,
  shortcut = 'Ctrl + K',
  className,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const value = externalValue !== undefined ? externalValue : internalValue;

  const handleChange = (e) => {
    if (onChange) onChange(e.target.value);
    else setInternalValue(e.target.value);
  };

  const handleClear = () => {
    if (onClear) onClear();
    if (onChange) onChange('');
    else setInternalValue('');
  };

  return (
    <div className={cn('relative flex items-center w-full max-w-md group', className)}>
      <Search className="absolute left-3.5 w-4 h-4 text-gray-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-20 py-2 bg-gray-900/80 hover:bg-gray-900 border border-gray-800 focus:border-blue-500/60 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 backdrop-blur-md transition-all duration-200 font-sans"
      />
      <div className="absolute right-3 flex items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : shortcut ? (
          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded border border-gray-700 select-none">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </span>
        ) : null}
      </div>
    </div>
  );
};
