import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Plus, Loader2 } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  id?: string;
  label: string;
  placeholder?: string;
  options: Option[];
  value: string; // name or id
  onChange: (name: string, id: string) => void;
  onCreateOption?: (name: string) => Promise<Option | null>;
  required?: boolean;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  placeholder = 'Select option...',
  options,
  value,
  onChange,
  onCreateOption,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const exactMatchExists = options.some(
    opt => opt.name.toLowerCase().trim() === search.toLowerCase().trim()
  );

  const selectedOption = options.find(
    opt => opt.id === value || opt.name.toLowerCase() === value.toLowerCase()
  );

  const handleSelect = (opt: Option) => {
    onChange(opt.name, opt.id);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreateNew = async () => {
    const trimmed = search.trim();
    if (!trimmed || !onCreateOption) return;

    // Check if duplicate case-insensitively
    const existing = options.find(
      opt => opt.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      handleSelect(existing);
      return;
    }

    setIsCreating(true);
    try {
      const created = await onCreateOption(trimmed);
      if (created) {
        onChange(created.name, created.id);
      }
      setIsOpen(false);
      setSearch('');
    } catch (err) {
      console.error('Failed to create option:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative" ref={containerRef} id={id ? `${id}-container` : undefined}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Button to open dropdown */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-left text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <span className={selectedOption ? 'font-medium' : 'text-slate-400'}>
          {selectedOption ? selectedOption.name : (value || placeholder)}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search box inside dropdown */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search or add ${label.toLowerCase()}...`}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0]);
                  } else if (search.trim() && onCreateOption && !exactMatchExists) {
                    handleCreateNew();
                  }
                }
              }}
            />
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 text-xs">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedOption?.id === opt.id || selectedOption?.name === opt.name;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="py-2 text-center text-xs text-slate-400">
                No matching {label.toLowerCase()} found
              </div>
            )}

            {/* Create option if not in list and search is typed */}
            {search.trim() && !exactMatchExists && onCreateOption && (
              <button
                type="button"
                disabled={isCreating}
                onClick={handleCreateNew}
                className="w-full mt-1 flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 p-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950"
              >
                {isCreating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">Add new {label}: &ldquo;{search.trim()}&rdquo;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
