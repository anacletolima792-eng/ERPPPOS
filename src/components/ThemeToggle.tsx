import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  id?: string;
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  id = 'btn-toggle-theme',
  className = '',
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      id={id}
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer border ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-xs'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-2xs'
      } ${className}`}
      title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
      aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 stroke-[2.2]" />
      ) : (
        <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-600 stroke-[2.2]" />
      )}
      {showLabel && (
        <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </span>
      )}
    </button>
  );
};
