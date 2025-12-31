'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

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

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

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
}

export const ControlSlider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, displayValue, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center gap-3", className)}>
        <input
          type="range"
          ref={ref}
          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600 hover:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          {...props}
        />
        {displayValue !== undefined && (
          <span className="w-12 text-right text-xs font-mono text-gray-500 dark:text-gray-400 tabular-nums">
            {displayValue}
          </span>
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
  ({ className, label, ...props }, ref) => {
    return (
      <label className={cn("flex items-center gap-3 cursor-pointer group", className)}>
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
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
  label: string;
  description?: string;
}

export const ControlCheckbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <label className={cn("flex items-start gap-3 p-2 -ml-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group", className)}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            ref={ref}
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

