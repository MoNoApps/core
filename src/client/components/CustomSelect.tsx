import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface SelectOption {
  label: string;
  value: any;
}

export interface CustomSelectProps {
  id?: string;
  name: string;
  value: any;
  onChange: (value: any) => void;
  options: Array<string | SelectOption>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function getSemanticDotColor(val: any): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).toLowerCase().trim();
  if (
    [
      "active",
      "published",
      "shipped",
      "paid",
      "completed",
      "operational",
      "delivered",
      "true",
    ].includes(str)
  ) {
    return "#10b981"; // emerald / green
  }
  if (
    [
      "pending",
      "processing",
      "draft",
      "lead",
      "authorized",
      "issued",
      "in-progress",
    ].includes(str)
  ) {
    return "#f59e0b"; // amber / orange
  }
  if (
    [
      "cancelled",
      "rejected",
      "overdue",
      "void",
      "suspended",
      "archived",
      "unpaid",
      "false",
    ].includes(str)
  ) {
    return "#ef4444"; // red
  }
  if (["vip", "gold", "enterprise partner"].includes(str)) {
    return "#8b5cf6"; // purple / gold
  }
  if (["silver", "wholesale buyer", "electronics"].includes(str)) {
    return "#3b82f6"; // blue
  }
  return null;
}

function formatLabel(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.length <= 3) return str.toUpperCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  required = false,
  disabled = false,
  hasError = false,
  className = "",
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Normalize options into { label, value } array
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { label: formatLabel(opt), value: opt };
      }
      return {
        label: opt.label || formatLabel(opt.value),
        value: opt.value,
      };
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        String(opt.value).toLowerCase().includes(term),
    );
  }, [normalizedOptions, searchTerm]);

  const showSearch = normalizedOptions.length > 5;

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(-1);
      if (showSearch) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
      }
    } else {
      setSearchTerm("");
    }
  }, [isOpen, showSearch]);

  // Scroll active option into view during keyboard navigation
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex, isOpen]);

  const handleSelect = useCallback(
    (optValue: any) => {
      onChange(optValue);
      setIsOpen(false);
      setSearchTerm("");
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setSearchTerm("");
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm("");
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
        handleSelect(filteredOptions[activeIndex].value);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      }
    } else if (e.key === "Tab") {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const selectedDotColor = selectedOption
    ? getSemanticDotColor(selectedOption.value)
    : null;

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`}
      style={{ position: "relative", width: "100%", ...style }}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input to maintain native form parity and automated form readers */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value ?? ""}
        required={required}
      />

      {/* Main Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        className={`custom-select-trigger ${hasError ? "has-error" : ""} ${isOpen ? "focused" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={id}
      >
        <div className="custom-select-trigger-content">
          {selectedOption ? (
            <span className="custom-select-selected-value">
              {selectedDotColor && (
                <span
                  className="custom-select-dot"
                  style={{ backgroundColor: selectedDotColor }}
                />
              )}
              <span className="custom-select-label-text">
                {selectedOption.label}
              </span>
            </span>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="custom-select-actions">
          {!required && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              className="custom-select-clear-btn"
              onClick={handleClear}
              title="Clear selection"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`custom-select-chevron ${isOpen ? "rotated" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Menu (UI When Open) */}
      {isOpen && (
        <div className="custom-select-menu" role="listbox">
          {/* Quick Search Header */}
          {showSearch && (
            <div className="custom-select-search-header">
              <Search size={14} className="custom-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder={`Search ${normalizedOptions.length} options...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setActiveIndex(0);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="custom-select-search-clear"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <ul ref={listRef} className="custom-select-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isActive = idx === activeIndex;
                const dotColor = getSemanticDotColor(opt.value);

                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`custom-select-option ${isSelected ? "is-selected" : ""} ${isActive ? "is-active" : ""}`}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className="custom-select-option-content">
                      {dotColor && (
                        <span
                          className="custom-select-dot"
                          style={{ backgroundColor: dotColor }}
                        />
                      )}
                      <span className="custom-select-option-label">
                        {opt.label}
                      </span>
                    </div>

                    {isSelected && (
                      <Check size={15} className="custom-select-check-icon" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="custom-select-empty-state">
                <span>No options matching "{searchTerm}"</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
