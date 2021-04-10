import React from 'react';

type SimpleInputProps = {
    label?: string,
    placeholder?: string,
    value?: any,
    onChange?: (value: string) => void,
    min?: number,
    max?: number,
    number?: boolean,
    noLeftMargin?: boolean,
    reverse?: boolean // Flip label/input order,
    className?: string
};

type SimpleInputState = {
    value: string
};

export default class SimpleInput extends React.Component<SimpleInputProps, SimpleInputState> {
    constructor(props: SimpleInputProps) {
        super(props);

        this.state = { value: this.props.value ? this.props.value : '' };
    }

    public componentDidUpdate(prevProps: SimpleInputProps): void {
        if (this.props.value !== undefined && prevProps.value !== this.props.value) {
            // setState is safe as wrapped in condition
            this.setState({ // eslint-disable-line react/no-did-update-set-state
                value: this.props.value,
            });
        }
    }

    private onChange(event: React.ChangeEvent<HTMLInputElement>): void {
        let originalValue = event.currentTarget.value;

        if (this.props.number) {
            originalValue = originalValue.replace(/[^\d.-]/g, ''); // Replace all non-numeric characters
        }

        this.props.onChange?.(originalValue);
        this.setState({ value: originalValue });
    }

    private onFocusOut(event: React.FocusEvent<HTMLInputElement>): void {
        const { value } = event.currentTarget;
        const constrainedValue = this.getConstrainedValue(value);

        this.props.onChange?.(constrainedValue);
        this.setState({ value: constrainedValue });
    }

    private getConstrainedValue(value: string): string {
        let constrainedValue = value;
        let numericValue = parseFloat(value);

        if (!Number.isNaN(numericValue)) {
            if (this.props.min !== undefined && numericValue < this.props.min) {
                numericValue = this.props.min;
            } else if (this.props.max !== undefined && numericValue > this.props.max) {
                numericValue = this.props.max;
            }

            constrainedValue = numericValue.toString();
        }
        return constrainedValue;
    }

    render() {
        return (
            <div className={`flex ${this.props.className} ${this.props.reverse ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex flex-grow ${this.props.noLeftMargin ? '' : 'm-2.5'} items-center ${this.props.reverse ? 'justify-start' : 'justify-end'}`}>{this.props.label ?? ''}</div>
                <div className="flex items-center">
                    <input
                        className="w-28 text-lg bg-gray-900 px-3 py-1.5 rounded"
                        value={this.state.value}
                        placeholder={this.props.placeholder ?? ''}
                        onChange={(event) => this.onChange(event)}
                        onBlur={(event) => this.onFocusOut(event)}
                    />
                </div>
            </div>
        );
    }
}
