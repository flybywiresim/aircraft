import { IconChevronDown } from '@tabler/icons';
import React from 'react';

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
    reverse?: boolean, // Flips label/input order
    options: Option[],
    dropdownOnTop?: boolean, // Display dropdown above input instead of below
    className?: string
};

type SelectInputState = {
    value: any,
    showDropdown: boolean
};

export default class SelectInput extends React.Component<SelectInputProps, SelectInputState> {
    constructor(props: SelectInputProps) {
        super(props);

        let defaultOption = this.props.options.find((opt) => opt.value === (this.props.defaultValue ?? 0));

        if (defaultOption === undefined) {
            defaultOption = { value: 0, displayValue: '' };
        }

        this.state = {
            value: defaultOption.displayValue,
            showDropdown: false,
        };
    }

    private onClicked = () => {
        this.setState((prevState) => {
            const newState = { ...prevState };

            newState.showDropdown = !prevState.showDropdown;

            return newState;
        });
    }

    private onOptionClicked = (option: Option) => {
        if (this.props.onChange) {
            this.props.onChange(option.value);
        }

        this.setState((prevState) => {
            const newState = { ...prevState };

            newState.value = option.displayValue;

            return newState;
        });
    }

    private dropdownElements = (): JSX.Element[] => {
        const optionElements: JSX.Element[] = [];

        for (const option of this.props.options) {
            optionElements.push((
                <div className="text-white hover:bg-white hover:bg-opacity-5 transition duration-300 rounded-lg px-5 py-1.5" onClick={() => this.onOptionClicked(option)}>
                    {option.displayValue}
                </div>
            ));
        }
        return optionElements;
    }

    render() {
        return (
            <div className={`flex ${this.props.reverse ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`text-lg flex flex-grow m-2.5 items-center ${this.props.reverse ? 'justify-start' : 'justify-end'}`}>{this.props.label}</div>
                <div className="flex items-center cursor-pointer relative" onClick={this.onClicked}>
                    <div className={`relative flex px-5 py-1.5 text-lg text-white rounded-lg bg-navy-light border-2 border-navy-light
                        focus-within:outline-none focus-within:border-teal-light-contrast ${this.props.className}`}
                    >
                        {this.state.value}
                        <IconChevronDown className="text-white absolute right-4 top-2.5" size={20} />
                    </div>
                    {this.state.showDropdown && (
                        <div className={`p-3 text-lg w-full border-none bg-navy-medium rounded-lg z-10 absolute transform ${
                            this.props.dropdownOnTop ? 'top-0 -translate-y-full' : 'bottom-0 translate-y-full'}`}
                        >
                            { this.dropdownElements() }
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
