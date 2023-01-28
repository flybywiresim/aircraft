import React from 'react';

interface SelectItemProps {
    disabled?: boolean;
    selected?: boolean;
    onSelect?: () => void;
    className?: string
}

const activeButtonRow = ({ disabled, selected }: Partial<SelectItemProps>) => {
    if (disabled) {
        return ('flex items-center justify-center px-6 py-2 text-theme-unselected bg-opacity-0 hover:bg-opacity-100 transition duration-300 cursor-not-allowed');
    }
    if (selected) {
        return ('flex items-center justify-center px-6 py-2 bg-theme-highlight bg-opacity-100 text-theme-body');
    }
    if (!selected) {
        return ('flex items-center justify-center px-6 py-2 bg-opacity-0 hover:bg-opacity-100 transition duration-300');
    }
    return undefined;
};

export const SelectItem: React.FC<SelectItemProps> = ({ children, className, disabled, onSelect, selected }) => (
    <span
        onClick={onSelect}
        className={`cursor-pointer ${activeButtonRow({ disabled, selected })} ${className}`}
    >
        {children}
    </span>
);

export const SelectGroup: React.FC<{className?: string}> = ({ children, className }) => (
    <div className={`flex overflow-hidden flex-row justify-between rounded-md border divide-x border-theme-accent divide-theme-accent ${className}`}>
        {children}
    </div>
);

export const VerticalSelectGroup: React.FC<{className?: string}> = ({ children, className }) => (
    <div className={`flex overflow-hidden flex-col rounded-md border divide-y divide-theme-accent border-theme-accent ${className}`}>
        {children}
    </div>
);
