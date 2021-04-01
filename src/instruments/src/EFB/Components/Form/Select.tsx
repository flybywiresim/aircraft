import React from 'react';

export type SelectProps = { selected?: boolean, onSelect?: () => void, classNames?: string };

export const Select: React.FC<SelectProps> = (props) => (
    <div onClick={props.onSelect || (() => {})} className={`${props.selected ? 'bg-blue-light-contrast' : 'bg-blue-dark'} ml-1.5 px-5 py-1.5 rounded-lg flex flex-row justify-between`}>
        <span className={`${props.classNames} text-lg text-white mt-0.5`}>{props.children}</span>
    </div>
);

export type SelectItemProps = { selected?: boolean, onSelect?: () => void, classNames?: string };

export const SelectItem: React.FC<SelectItemProps> = (props) => (
    <span onClick={props.onSelect || (() => {})} className={`text-lg font-medium ${props.selected ? 'bg-blue-light-contrast text-blue-darkest' : 'text-white'} py-2 px-3.5 rounded-lg`}>
        {props.children}
    </span>
);

export const SelectGroup: React.FC = (props) => (
    <div className="bg-blue-dark flex flex-row justify-between rounded-lg">
        {props.children}
    </div>
);

export const VerticalSelectGroup: React.FC = (props) => (
    <div className="bg-gray-800 flex flex-col justify-between rounded-lg">
        {props.children}
    </div>
);
