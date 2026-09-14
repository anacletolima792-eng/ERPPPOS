import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Layers, X, Tag } from 'lucide-react';
import { Category, Product } from '../types';

interface CategoryDropdownProps {
  categories: Category[];
  products: Product[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  products,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const totalCount = products.length;

  const getCategoryCount = (categoryId: string) => {
    return products.filter((p) => p.categoryId === categoryId).length;
  };

  const handleSelect = (id: string) => {
    onSelectCategory(id);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="btn-category-dropdown"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs ${
            isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : selectedCategoryId !== 'all'
              ? 'border-blue-300 bg-blue-50/40 text-blue-900'
              : 'border-slate-200 text-slate-700'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                selectedCategoryId !== 'all' && selectedCategory?.color
                  ? 'bg-opacity-20'
                  : 'bg-slate-100 text-slate-500'
              }`}
              style={{
                backgroundColor:
                  selectedCategoryId !== 'all' && selectedCategory?.color
                    ? `${selectedCategory.color}20`
                    : undefined,
              }}
            >
              {selectedCategoryId !== 'all' && selectedCategory?.color ? (
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
              ) : (
                <Layers className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>

            <div className="flex items-center gap-2 truncate">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Categoria:
              </span>
              <span className="font-bold text-slate-800 truncate">
                {selectedCategoryId === 'all'
                  ? 'Todas as Categorias'
                  : selectedCategory?.name || 'Categoria'}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold">
                {selectedCategoryId === 'all'
                  ? `${totalCount} itens`
                  : `${getCategoryCount(selectedCategoryId)} itens`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            {selectedCategoryId !== 'all' && (
              <button
                type="button"
                id="btn-clear-category-selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCategory('all');
                }}
                className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                title="Limpar filtro de categoria"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          id="category-dropdown-menu"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 max-h-72 overflow-y-auto"
        >
          {/* Option: Todas as Categorias */}
          <button
            type="button"
            role="option"
            aria-selected={selectedCategoryId === 'all'}
            onClick={() => handleSelect('all')}
            className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-blue-50/80 text-blue-700 font-bold'
                : 'text-slate-700 hover:bg-slate-50 font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span>Todas as Categorias</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {totalCount}
              </span>
              {selectedCategoryId === 'all' && (
                <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />
              )}
            </div>
          </button>

          <div className="my-1 border-t border-slate-100" />

          {/* Option: Individual Categories */}
          {categories.map((c) => {
            const count = getCategoryCount(c.id);
            const isSelected = selectedCategoryId === c.id;

            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(c.id)}
                className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/80 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: c.color ? `${c.color}20` : '#f1f5f9',
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: c.color || '#3b82f6' }}
                    />
                  </div>
                  <span className="truncate">{c.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                  )}
                </div>
              </button>
            );
          })}

          {categories.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-slate-400">
              Nenhuma categoria cadastrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
