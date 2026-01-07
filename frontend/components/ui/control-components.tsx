'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check, ChevronRight } from 'lucide-react';

/* -------------------------------------------------------------------------------------------------
 * Button Component
 * -----------------------------------------------------------------------------------------------*/

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600': variant === 'default',
            'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700': variant === 'outline',
            'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600': variant === 'destructive',
          },
          {
            'h-9 px-4 py-2': size === 'default',
            'h-8 px-3 text-xs': size === 'sm',
            'h-11 px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

/* -------------------------------------------------------------------------------------------------
 * Layout Components
 * -----------------------------------------------------------------------------------------------*/

export function ControlSection({ title, children, className, action }: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        {action}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

export function ControlGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}

export function ControlRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {children}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({ title, children, defaultOpen = true, className }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  // Dynamically import motion to avoid hydration mismatch if needed, but standard import is fine for client components.
  // Since this file is 'use client', we can use framer-motion directly.
  const { motion, AnimatePresence } = require('framer-motion');

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        {title}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pl-6 space-y-2 pt-1 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Input Components
 * -----------------------------------------------------------------------------------------------*/

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  action?: React.ReactNode;
}

export function ControlLabel({ children, className, action, ...props }: LabelProps) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label
        className={cn("text-xs font-medium text-gray-700 dark:text-gray-300 select-none", className)}
        {...props}
      >
        {children}
      </label>
      {action}
    </div>
  );
}

export const ControlInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:focus-visible:ring-blue-400 dark:text-gray-100",
          className
        )}
        {...props}
      />
    );
  }
);
ControlInput.displayName = "ControlInput";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { }

export const ControlSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-9 w-full appearance-none items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:ring-offset-gray-950 dark:text-gray-100 dark:focus:ring-blue-400",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
      </div>
    );
  }
);
ControlSelect.displayName = "ControlSelect";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  displayValue?: React.ReactNode;
  onValueChange?: (value: number) => void;
  parseValue?: (value: string) => number;
  formatValue?: (value: number) => string;
}

export const ControlSlider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, displayValue, onValueChange, parseValue, formatValue, onChange, ...props }, ref) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleDisplayClick = () => {
      if (displayValue !== undefined && onValueChange && props.value !== undefined) {
        let currentValue: number;
        if (typeof props.value === 'string') {
          currentValue = parseFloat(props.value);
        } else if (typeof props.value === 'number') {
          currentValue = props.value;
        } else if (Array.isArray(props.value)) {
          currentValue = parseFloat(props.value[0] || '0');
        } else {
          currentValue = 0;
        }
        setEditValue(formatValue ? formatValue(currentValue) : String(currentValue));
        setIsEditing(true);
      }
    };

    React.useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleSubmit = () => {
      if (onValueChange && editValue !== '') {
        const parsed = parseValue ? parseValue(editValue) : parseFloat(editValue);
        if (!isNaN(parsed)) {
          const min = props.min ? parseFloat(String(props.min)) : 0;
          const max = props.max ? parseFloat(String(props.max)) : 100;
          const clamped = Math.max(min, Math.min(max, parsed));
          onValueChange(clamped);
        }
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (onValueChange) {
        onValueChange(parseFloat(e.target.value));
      }
    };

    return (
      <div className={cn("relative flex items-center gap-3", className)}>
        <input
          type="range"
          ref={ref}
          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600 hover:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          onChange={handleChange}
          {...props}
        />
        {displayValue !== undefined && (
          <>
            {isEditing && onValueChange ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={handleKeyDown}
                className="w-12 text-right text-xs font-mono text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-blue-500 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <button
                type="button"
                onClick={handleDisplayClick}
                className={cn(
                  "w-12 text-right text-xs font-mono tabular-nums transition-colors",
                  onValueChange
                    ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                    : "text-gray-500 dark:text-gray-400 cursor-default"
                )}
              >
                {displayValue}
              </button>
            )}
          </>
        )}
      </div>
    );
  }
);
ControlSlider.displayName = "ControlSlider";

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const ControlToggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <label className={cn("flex items-center gap-3 cursor-pointer group", className)}>
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            checked={checked ?? false}
            {...props}
          />
          <div className="h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-1 dark:peer-focus:ring-offset-gray-900 peer-checked:bg-blue-600 transition-colors" />
          <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
          {label}
        </span>
      </label>
    );
  }
);
ControlToggle.displayName = "ControlToggle";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  description?: string;
}

export const ControlCheckbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, ...props }, ref) => {
    return (
      <label className={cn("flex items-start gap-3 p-2 -ml-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group", className)}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            ref={ref}
            checked={checked ?? false}
            {...props}
          />
        </div>
        <div className="flex-1 space-y-0.5">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            {label}
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </label>
    );
  }
);
ControlCheckbox.displayName = "ControlCheckbox";

