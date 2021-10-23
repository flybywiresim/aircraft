import React, { useEffect, useState } from 'react';
import { IconChevronDown } from '@tabler/icons';

type Option = {
    value: any,
    displayValue: string
};

/**
 * Options is array of options. Each option is an array, with the index 0 being the value and 1 being the display value
 * e.g [[0, "Value 1"], [1, "Value 2"]]
 * Options are displayed in order of list
 */
type SelectInputProps = {
    label: string,
    onChange?: (newValue: number | string | boolean) => void,
    defaultValue?: any,
    value?: any,
    reverse?: boolean, // Flips label/input order
    options: Option[],
    dropdownOnTop?: boolean, // Display dropdown above input instead of below
    className?: string
};

const defaultOptionFallback: Option = { value: 0, displayValue: '' };

const SelectInput = (props: SelectInputProps) => {
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

    const dropdownElements = (): JSX.Element[] => {
        const optionElements: JSX.Element[] = [];

        for (const option of props.options) {
            optionElements.push((
                <div className="py-1.5 px-5 hover:bg-white hover:bg-opacity-5 rounded-lg transition duration-300" onClick={() => onOptionClicked(option)}>
                    {option.displayValue}
                </div>
            ));
        }
        return optionElements;
    };

    function handleToggleDropdown() {
        setShowDropdown(!showDropdown);
    }

    return (
        <div className={`flex ${props.reverse ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`text-lg flex flex-grow m-2.5 items-center ${props.reverse ? 'justify-start' : 'justify-end'}`}>{props.label}</div>
            <div className="flex relative items-center cursor-pointer" onClick={handleToggleDropdown}>
                <div className={`relative flex px-5 py-1.5 text-lg  rounded-lg bg-navy-light border-2 border-navy-light
                        focus-within:outline-none focus-within:border-teal-light-contrast ${props.className}`}
                >
                    {value}
                    <IconChevronDown className="absolute top-2.5 right-4" size={20} />
                </div>
                {showDropdown && (
                    <div className={`p-3 text-lg w-full border-none bg-navy-medium rounded-lg z-10 absolute transform
                    ${' '}${props.dropdownOnTop ? 'top-0 -translate-y-full' : 'bottom-0 translate-y-full'}`}
                    >
                        { dropdownElements() }
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelectInput;
