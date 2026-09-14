import React, { useRef } from 'react';
import { formatBRLCurrencyInput, parseCurrencyToCents } from '../utils/formatters';

export interface CurrencyInputProps {
  value: number | string;
  onChange: (numericVal: number, formattedString: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  prefix?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  id,
  name,
  placeholder = '0,00',
  required = false,
  disabled = false,
  className = '',
  prefix = 'R$',
  autoFocus = false,
  onBlur,
  onFocus,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const cents = parseCurrencyToCents(value);
  const displayValue = formatBRLCurrencyInput(cents);

  const setCursorToEnd = () => {
    if (inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(setCursorToEnd, 10);
    onFocus?.();
  };

  const handleClick = () => {
    setCursorToEnd();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isSelectedAll =
      inputRef.current &&
      inputRef.current.selectionStart !== null &&
      inputRef.current.selectionEnd !== null &&
      inputRef.current.selectionEnd - inputRef.current.selectionStart > 0;

    // Handle Backspace (delete right-most digit)
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (isSelectedAll) {
        onChange(0, '0,00');
        return;
      }
      const currentDigits = cents.toString();
      const newDigits = currentDigits.length > 1 ? currentDigits.slice(0, -1) : '0';
      const newCents = parseInt(newDigits, 10) || 0;
      const newNum = newCents / 100;
      onChange(newNum, formatBRLCurrencyInput(newCents));
      return;
    }

    // Handle typing numeric digits (0-9)
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (isSelectedAll) {
        const newCents = parseInt(e.key, 10) || 0;
        const newNum = newCents / 100;
        onChange(newNum, formatBRLCurrencyInput(newCents));
        return;
      }

      // Max 10 digits to prevent overflowing integer (up to R$ 99.999.999,99)
      const currentDigits = cents > 0 ? cents.toString() : '';
      if (currentDigits.length >= 10) return;

      const newDigits = currentDigits + e.key;
      const newCents = parseInt(newDigits, 10) || 0;
      const newNum = newCents / 100;
      onChange(newNum, formatBRLCurrencyInput(newCents));
      return;
    }

    // Allow navigation keys & shortcuts
    if (
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.key === 'Escape' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown'
    ) {
      return;
    }

    // Allow Ctrl/Cmd combos (select all, copy, paste, cut)
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Block all other keys (letters, symbols, commas, periods)
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fallback for paste and mobile numeric keyboards
    const rawDigits = e.target.value.replace(/\D/g, '');
    const newCents = parseInt(rawDigits, 10) || 0;
    const newNum = newCents / 100;
    onChange(newNum, formatBRLCurrencyInput(newCents));
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-3 text-xs font-bold text-slate-400 select-none pointer-events-none z-10">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`${prefix ? 'pl-9 pr-3.5' : 'px-3'} ${className} text-right font-mono tracking-tight`}
      />
    </div>
  );
};

export default CurrencyInput;
