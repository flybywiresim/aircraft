import React from 'react';

export type SelectProps = { selected?: boolean, onSelect?: () => void, classNames?: string };

export const Select: React.FC<SelectProps> = (props) => (
    <div onClick={props.onSelect || (() => {})} className={`${props.selected ? 'bg-teal-light-contrast' : 'bg-navy-light'} ml-1.5 px-5 py-1.5 rounded-lg flex flex-row justify-between`}>
        <span className={`${props.classNames} text-lg text-white mt-0.5`}>{props.children}</span>
    </div>
);

export type SelectItemProps = {enabled?: boolean, selected?: boolean, onSelect?: () => void, classNames?: string };

export const activeButtonRow = (props) => {
    if (props.enabled && props.selected) {
        return ('text-lg font-medium bg-teal-light-contrast text-blue-darkest text-white py-2 px-3.5 rounded-lg');
    }
    if (props.enabled && !props.selected) {
        return ('text-lg font-medium text-white py-2 px-3.5 rounded-lg');
    }
    if (!props.enabled) {
        return ('text-lg font-medium text-gray-600 py-2 px-3.5 rounded-lg');
    }
    return;
};

export const SelectItem: React.FC<SelectItemProps> = (props) => (
    <span
        onClick={props.onSelect || (() => {})}
        className={`${props.classNames} ` + activeButtonRow(props)}
    >
        {props.children}
    </span>
);

export const SelectGroup: React.FC = (props) => (
    <div className="bg-navy-light flex flex-row justify-between rounded-lg">
        {props.children}
    </div>
);

export const VerticalSelectGroup: React.FC = (props) => (
    <div className="bg-navy-lighter flex flex-col justify-between rounded-2xl">
        {props.children}
    </div>
);
