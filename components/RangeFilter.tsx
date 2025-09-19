'use client';

import { useState, useEffect } from 'react';

interface RangeFilterProps {
  title: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  suffix?: string;
}

export function RangeFilter({
  title,
  min,
  max,
  value,
  onChange,
  step = 1,
  suffix = '',
}: RangeFilterProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const clampedMin = Math.max(min, Math.min(numValue, localValue[1]));
    const newValue: [number, number] = [clampedMin, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const clampedMax = Math.min(max, Math.max(numValue, localValue[0]));
    const newValue: [number, number] = [localValue[0], clampedMax];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleReset = () => {
    const resetValue: [number, number] = [min, max];
    setLocalValue(resetValue);
    onChange(resetValue);
  };

  const isActive = localValue[0] !== min || localValue[1] !== max;

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{title}</h3>
        {isActive && (
          <button
            onClick={handleReset}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Sıfırla
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Range inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Min {suffix}
            </label>
            <input
              type="text"
              value={localValue[0]}
              onChange={(e) => {
                // Only allow positive numbers and decimal points
                const value = e.target.value.replace(/[^0-9.]/g, '');
                if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  handleMinChange(value);
                }
              }}
              placeholder="Min"
              style={{ color: '#000000' }}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Max {suffix}
            </label>
            <input
              type="text"
              value={localValue[1]}
              onChange={(e) => {
                // Only allow positive numbers and decimal points
                const value = e.target.value.replace(/[^0-9.]/g, '');
                if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  handleMaxChange(value);
                }
              }}
              placeholder="Max"
              style={{ color: '#000000' }}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>


        {/* Current range display */}
        <div className="text-center text-sm text-gray-600">
          {localValue[0]}{suffix} - {localValue[1]}{suffix}
        </div>
      </div>

    </div>
  );
}
