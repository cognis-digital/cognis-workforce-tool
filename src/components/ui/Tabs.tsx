import React, { useState } from 'react';

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: '',
  onValueChange: () => {},
});

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className = '',
  children,
}: TabsProps) {
  const [tabValue, setTabValue] = useState(value || defaultValue || '');
  
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setTabValue(newValue);
    }
  };
  
  // Use controlled value if provided
  const currentValue = value !== undefined ? value : tabValue;
  
  return (
    <TabsContext.Provider 
      value={{ value: currentValue, onValueChange: handleValueChange }}
    >
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }: TabsListProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className = '',
  children,
  disabled = false,
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;
  
  return (
    <button
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      className={`
        px-4 py-2 font-medium transition-colors
        ${isSelected 
          ? 'text-primary-500 border-b-2 border-primary-500' 
          : 'text-white/60 hover:text-white border-b-2 border-transparent'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={() => !disabled && onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className = '',
  children,
}: TabsContentProps) {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;
  
  if (!isSelected) return null;
  
  return (
    <div
      role="tabpanel"
      className={`mt-2 ${className}`}
    >
      {children}
    </div>
  );
}
