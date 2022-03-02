import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'react-bootstrap-icons';

interface Option {
    value: any;
    displayValue: string;
}

/**
 * Options is array of options. Each option is an array, with the index 0 being the value and 1 being the display value
 * e.g [[0, "Value 1"], [1, "Value 2"]]
 * Options are displayed in order of list
 */
interface SelectInputProps {
    onChange?: (newValue: number | string | boolean) => void;
    defaultValue?: any;
    value?: any;
    reverse?: boolean; // Flips label/input order
    options: Option[];
    dropdownOnTop?: boolean; // Display dropdown above input instead of below
    className?: string;
    forceShowAll?: boolean; // Forces dropdown to show all options
}

const defaultOptionFallback: Option = { value: 0, displayValue: '' };

export const SelectInput = (props: SelectInputProps) => {
    const defaultOption = props.options.find((option) => option.value === (props.defaultValue ?? 0)) ?? defaultOptionFallback;

    const [value, setValue] = useState<any>(defaultOption.displayValue);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (props.value === undefined) return;

        const option = props.options.find((option) => option.value === props.value) ?? defaultOption;

        setValue(option.displayValue);
    }, [props.value]);

    const onOptionClicked = (option: Option) => {
        if (props.onChange) {
            props.onChange(option.value);
        }
        setValue(option.displayValue);
    };

    const handleToggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    return (
        <div className="flex flex-row">
            <div
                className={`relative border-2 cursor-pointer border-theme-accent rounded-md ${props.className} ${' '}
                ${showDropdown && (props.dropdownOnTop ? 'border-t-theme-body rounded-t-none' : 'border-b-theme-body rounded-b-none')}`}
                onClick={handleToggleDropdown}
            >
                <div className="flex relative py-1.5 px-3">
                    {value}
                    <ChevronDown className={`absolute inset-y-0 h-full right-3 transform duration-100 ${showDropdown && '-rotate-180'}`} size={20} />
                </div>
                {showDropdown && (
                    <div
                        className={`z-10 absolute flex -inset-x-0.5 transform overflow-hidden bg-theme-body border-2 border-theme-accent${' '}
                        ${props.dropdownOnTop
                        ? 'top-0 -translate-y-full rounded-t-md border-b-0 flex-col-reverse'
                        : 'bottom-0 translate-y-full rounded-b-md border-t-0 flex-col'}
                        `}
                    >
                        {props.options.map((option) => (
                            (value !== option.displayValue || props.forceShowAll) && (
                                <div
                                    className="py-1.5 px-3 hover:text-theme-body hover:bg-theme-highlight hover:bg-opacity-5 transition duration-300"
                                    onClick={() => onOptionClicked(option)}
                                >
                                    {option.displayValue}
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
