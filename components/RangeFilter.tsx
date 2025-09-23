'use client';

import { useState, useEffect, useCallback } from 'react';

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
  // Current applied values (what's actually filtering)
  const [appliedValue, setAppliedValue] = useState(value);
  // Local working values (what user is editing)
  const [workingValue, setWorkingValue] = useState(value);
  // Input display values to allow temporary empty states
  const [inputValues, setInputValues] = useState({
    min: value[0].toString(),
    max: value[1].toString()
  });

  useEffect(() => {
    setAppliedValue(value);
    setWorkingValue(value);
    setInputValues({
      min: value[0].toString(),
      max: value[1].toString()
    });
  }, [value]);

  const handleMinChange = (inputValue: string) => {
    setInputValues(prev => ({ ...prev, min: inputValue }));
    
    // Update working value if valid number
    if (inputValue !== '') {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        const clampedMin = Math.max(min, Math.min(numValue, workingValue[1]));
        setWorkingValue([clampedMin, workingValue[1]]);
      }
    }
  };

  const handleMaxChange = (inputValue: string) => {
    setInputValues(prev => ({ ...prev, max: inputValue }));
    
    // Update working value if valid number
    if (inputValue !== '') {
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        const clampedMax = Math.min(max, Math.max(numValue, workingValue[0]));
        setWorkingValue([workingValue[0], clampedMax]);
      }
    }
  };

  // Handle when input loses focus (if empty, restore to current working value)
  const handleMinBlur = () => {
    if (inputValues.min === '') {
      setInputValues(prev => ({ ...prev, min: workingValue[0].toString() }));
    }
  };

  const handleMaxBlur = () => {
    if (inputValues.max === '') {
      setInputValues(prev => ({ ...prev, max: workingValue[1].toString() }));
    }
  };

  // Apply the current working values (triggers API call)
  const handleApply = () => {
    const newValue: [number, number] = [workingValue[0], workingValue[1]];
    setAppliedValue(newValue);
    onChange(newValue);
  };

  // Reset to full range (triggers API call)
  const handleReset = () => {
    const resetValue: [number, number] = [min, max];
    setAppliedValue(resetValue);
    setWorkingValue(resetValue);
    setInputValues({
      min: min.toString(),
      max: max.toString()
    });
    onChange(resetValue);
  };

  const isActive = appliedValue[0] !== min || appliedValue[1] !== max;
  const hasChanges = workingValue[0] !== appliedValue[0] || workingValue[1] !== appliedValue[1];

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{title}</h3>
        {isActive && (
          <span className="text-xs text-green-600 font-medium">Aktif</span>
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
              value={inputValues.min}
              onChange={(e) => {
                // Only allow positive numbers and decimal points
                const value = e.target.value.replace(/[^0-9.]/g, '');
                if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  handleMinChange(value);
                }
              }}
              onBlur={handleMinBlur}
              placeholder={`Min (${min})`}
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
              value={inputValues.max}
              onChange={(e) => {
                // Only allow positive numbers and decimal points
                const value = e.target.value.replace(/[^0-9.]/g, '');
                if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  handleMaxChange(value);
                }
              }}
              onBlur={handleMaxBlur}
              placeholder={`Max (${max})`}
              style={{ color: '#000000' }}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={!hasChanges}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Uygula
          </button>
          <button
            onClick={handleReset}
            disabled={!isActive}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
              isActive
                ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Sıfırla
          </button>
        </div>

        {/* Current range display */}
        <div className="text-center space-y-1">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Çalışma:</span> {workingValue[0]}{suffix} - {workingValue[1]}{suffix}
          </div>
          {isActive && (
            <div className="text-xs text-green-600">
              <span className="font-medium">Uygulanan:</span> {appliedValue[0]}{suffix} - {appliedValue[1]}{suffix}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
