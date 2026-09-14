import React, { useState, useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

export interface QuantityStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'blue' | 'orange';
  id?: string;
  className?: string;
  disabled?: boolean;
  unit?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 99999,
  step = 1,
  size = 'md',
  colorScheme = 'blue',
  id,
  className = '',
  disabled = false,
  unit,
}) => {
  const [textValue, setTextValue] = useState<string>(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal text state with external value when not typing
  useEffect(() => {
    if (!isFocused) {
      setTextValue(value.toString());
    }
  }, [value, isFocused]);

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const nextVal = Math.max(min, value - step);
    onChange(nextVal);
    setTextValue(nextVal.toString());
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const nextVal = Math.min(max, value + step);
    onChange(nextVal);
    setTextValue(nextVal.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Allow digits only
    const cleanDigits = rawVal.replace(/[^\d]/g, '');
    setTextValue(cleanDigits);

    if (cleanDigits !== '') {
      const parsed = parseInt(cleanDigits, 10);
      if (!isNaN(parsed)) {
        const clamped = Math.min(max, Math.max(min, parsed));
        onChange(clamped);
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (textValue.trim() === '') {
      onChange(min);
      setTextValue(min.toString());
      return;
    }

    const parsed = parseInt(textValue, 10);
    if (isNaN(parsed)) {
      onChange(min);
      setTextValue(min.toString());
    } else {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
      setTextValue(clamped.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextVal = Math.min(max, value + step);
      onChange(nextVal);
      setTextValue(nextVal.toString());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextVal = Math.max(min, value - step);
      onChange(nextVal);
      setTextValue(nextVal.toString());
    }
  };

  // Styles based on size
  const sizeStyles = {
    sm: {
      container: 'h-7 sm:h-7.5 p-0.5',
      btn: 'w-6 h-6 rounded-md',
      icon: 'w-3 h-3',
      input: 'w-7 sm:w-8 text-xs',
    },
    md: {
      container: 'h-8 sm:h-9 p-0.5',
      btn: 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg',
      icon: 'w-3.5 h-3.5',
      input: 'w-8 sm:w-10 text-xs sm:text-sm',
    },
    lg: {
      container: 'h-10 p-1',
      btn: 'w-8 h-8 rounded-xl',
      icon: 'w-4 h-4',
      input: 'w-14 sm:w-16 text-sm sm:text-base',
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  // Colors: exactly matching user's uploaded pill design
  const isBlue = colorScheme === 'blue';
  const decBtnClass = isBlue
    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
    : 'bg-orange-50 hover:bg-orange-100 text-orange-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';

  const incBtnClass = isBlue
    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-2xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed';

  const borderClass = isBlue
    ? 'border-blue-200/90 hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200/50'
    : 'border-orange-200/90 hover:border-orange-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200/50';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-between bg-white border rounded-xl sm:rounded-2xl shadow-2xs transition-all ${borderClass} ${currentSize.container} ${className}`}
    >
      {/* Minus button */}
      <button
        type="button"
        id={id ? `${id}-dec` : undefined}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={`flex items-center justify-center font-black transition-all cursor-pointer select-none shrink-0 ${currentSize.btn} ${decBtnClass}`}
        title="Diminuir quantidade"
        aria-label="Diminuir quantidade"
      >
        <Minus className={`${currentSize.icon} stroke-[2.5]`} />
      </button>

      {/* Editable numeric input */}
      <div className="flex items-center justify-center px-0.5 flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          id={id}
          value={textValue}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={(e) => {
            setIsFocused(true);
            e.target.select();
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLInputElement).select();
          }}
          className={`bg-transparent text-center font-black text-slate-900 focus:outline-none focus:bg-blue-50/40 rounded transition-colors ${currentSize.input}`}
          aria-label="Quantidade"
        />
        {unit && (
          <span className="text-[10px] font-bold text-slate-400 select-none mr-1 uppercase">
            {unit}
          </span>
        )}
      </div>

      {/* Plus button */}
      <button
        type="button"
        id={id ? `${id}-inc` : undefined}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={`flex items-center justify-center font-black transition-all cursor-pointer select-none shrink-0 ${currentSize.btn} ${incBtnClass}`}
        title="Aumentar quantidade"
        aria-label="Aumentar quantidade"
      >
        <Plus className={`${currentSize.icon} stroke-[2.5]`} />
      </button>
    </div>
  );
};

export default QuantityStepper;
