"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Simplified Combobox implementation
interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  setValue: (value: string) => void;
}

const ComboboxContext = React.createContext<ComboboxContextValue | undefined>(undefined);

function useComboboxContext() {
  const context = React.useContext(ComboboxContext);
  if (!context) {
    throw new Error("Combobox components must be used within a Combobox");
  }
  return context;
}

export function Combobox({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <ComboboxContext.Provider value={{ open, setOpen, value, setValue }}>
      <div className={cn("relative", className)} {...props}>
        {children}
      </div>
    </ComboboxContext.Provider>
  );
}

export function ComboboxTrigger({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useComboboxContext();
  
  return (
    <button
      type="button"
      className={cn("w-full", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ComboboxContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useComboboxContext();
  
  if (!open) return null;
  
  return (
    <div className={cn("absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md", className)} {...props}>
      {children}
    </div>
  );
}

export function ComboboxInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const { value, setValue } = useComboboxContext();
  
  return (
    <input
      className={cn("w-full px-3 py-2 border rounded-md", className)}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      {...props}
    />
  );
}

export function ComboboxList({ children, className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("max-h-60 overflow-auto py-1", className)} {...props}>
      {children}
    </ul>
  );
}

export function ComboboxItem({ 
  children, 
  value: itemValue, 
  className, 
  ...props 
}: React.LiHTMLAttributes<HTMLLIElement> & { value: string }) {
  const { value, setValue, setOpen } = useComboboxContext();
  const isSelected = value === itemValue;
  
  return (
    <li
      className={cn(
        "relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-accent",
        isSelected && "bg-accent",
        className
      )}
      onClick={() => {
        setValue(itemValue);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </li>
  );
}

// Export stubs for other components to maintain compatibility
export const ComboboxValue = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const ComboboxClear = ({ className, ...props }: any) => null;
export const ComboboxPopup = ({ children, ...props }: any) => <>{children}</>;
export const ComboboxPositioner = ({ children, ...props }: any) => <>{children}</>;
export const ComboboxGroup = ({ children, ...props }: any) => <>{children}</>;
export const ComboboxGroupLabel = ({ children, ...props }: any) => <>{children}</>;
export const ComboboxCollection = ({ children, ...props }: any) => <>{children}</>;
export const ComboboxEmpty = ({ children, ...props }: any) => <>{children}</>;
export const ComboboxSeparator = (props: any) => <hr {...props} />;
export const ComboboxChips = (props: any) => null;
export const ComboboxChip = (props: any) => null;
