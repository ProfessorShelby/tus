'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface FacetGroupProps {
  title: string;
  values: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FacetGroup({
  title,
  values,
  selectedValues,
  onChange,
  searchable = false,
  collapsible = false,
  defaultCollapsed = false,
}: FacetGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredValues = searchable
    ? values.filter(value =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      ).sort((a, b) => a.localeCompare(b, 'tr'))
    : values.sort((a, b) => a.localeCompare(b, 'tr'));

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    onChange(filteredValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div
        className={`p-3 bg-gray-50 border-b border-gray-200 ${
          collapsible ? 'cursor-pointer' : ''
        }`}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {collapsible && (
            isCollapsed ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronUpIcon className="h-4 w-4" />
          )}
        </div>
        {selectedValues.length > 0 && (
          <p className="text-sm text-blue-600 mt-1">
            {selectedValues.length} seçili
          </p>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-3">
          {searchable && (
            <input
              type="text"
              placeholder={`${title} ara...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          <div className="flex gap-2 mb-3">
            <button
              onClick={handleSelectAll}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Tümünü Seç
            </button>
            <button
              onClick={handleClearAll}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Temizle
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredValues.map((value) => (
              <label
                key={value}
                className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={() => handleToggle(value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{value}</span>
              </label>
            ))}
          </div>

          {filteredValues.length === 0 && searchTerm && (
            <p className="text-sm text-gray-500 text-center py-4">
              Arama kriterine uygun sonuç bulunamadı
            </p>
          )}
        </div>
      )}
    </div>
  );
}
