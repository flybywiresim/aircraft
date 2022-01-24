import React from 'react';

interface SelectItemProps {
    disabled?: boolean;
    selected?: boolean;
    onSelect?: () => void;
    className?: string
}

const activeButtonRow = (props) => {
    if (props.disabled) {
        return ('flex items-center px-6 py-2 text-theme-unselected bg-opacity-0 hover:bg-opacity-100 transition duration-300 cursor-not-allowed');
    }
    if (props.selected) {
        return ('flex items-center px-6 py-2 bg-theme-highlight bg-opacity-100');
    }
    if (!props.selected) {
        return ('flex items-center px-6 py-2 bg-opacity-0 hover:bg-opacity-100 transition duration-300');
    }
    return undefined;
};

export const SelectItem: React.FC<SelectItemProps> = (props) => (
    <span
        onClick={props.onSelect || (() => {})}
        className={`cursor-pointer ${props.className} ${activeButtonRow(props)}`}
    >
        {props.children}
    </span>
);

export const SelectGroup: React.FC = (props) => (
    <div className="flex overflow-hidden flex-row justify-between rounded-md border divide-x border-theme-accent divide-theme-accent">
        {props.children}
    </div>
);

export const VerticalSelectGroup: React.FC = (props) => (
    <div className="flex overflow-hidden flex-col rounded-md border divide-y divide-theme-accent border-theme-accent">
        {props.children}
    </div>
);
