import React from 'react';

export type SelectProps = { selected?: boolean, onSelect?: () => void, classNames?: string };

export const Select: React.FC<SelectProps> = (props) => (
    <div onClick={props.onSelect || (() => {})} className={`${props.selected ? 'bg-teal-light-contrast' : 'bg-navy-light'} ml-1.5 px-5 py-1.5 rounded-lg flex flex-row justify-between`}>
        <span className={`${props.classNames} text-lg  mt-0.5`}>{props.children}</span>
    </div>
);

export type SelectItemProps = {enabled?: boolean, selected?: boolean, onSelect?: () => void, classNames?: string };

export const activeButtonRow = (props) => {
    if (props.enabled && props.selected) {
        return ('flex items-center px-6 py-2 bg-theme-highlight bg-opacity-100');
    }
    if (props.enabled && !props.selected) {
        return ('flex items-center px-6 py-2 bg-opacity-0 hover:bg-opacity-100 transition duration-300');
    }
    if (!props.enabled) {
        return ('flex items-center px-6 py-2 text-theme-unselected bg-opacity-0 hover:bg-opacity-100 transition duration-300');
    }
    return undefined;
};

export const SelectItem: React.FC<SelectItemProps> = (props) => (
    <span
        onClick={props.onSelect || (() => {})}
        className={`${props.classNames} ${activeButtonRow(props)}`}
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
    <div className="flex overflow-hidden flex-col justify-between rounded-md border divide-y divide-theme-accent border-theme-accent">
        {props.children}
    </div>
);
