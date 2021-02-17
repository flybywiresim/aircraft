import React from 'react';

type SimpleInputProps = {
	label: string,
	placeholder?: string,
	onChange?: (value: string) => void,
	min?: number,
	max?: number,
	reverse?: boolean // Flip label/input order
};

type SimpleInputState = {
	value: string
};

export default class SimpleInput extends React.Component<SimpleInputProps, SimpleInputState> {
	constructor(props: SimpleInputProps) {
		super(props);
		this.state = {
			value: ''
		}
	}

	private onChange(event: React.ChangeEvent<HTMLInputElement>): void {
		let originalValue = event.currentTarget.value;
		let constrainedValue = this.getConstrainedValue(originalValue);

		this.props.onChange?.(constrainedValue);
		this.setState({
			value: originalValue
		});
	}

	private onFocusOut(event: React.FocusEvent<HTMLInputElement>): void {
		let value = event.currentTarget.value;
		let constrainedValue = this.getConstrainedValue(value);

		this.props.onChange?.(constrainedValue);
		this.setState({
			value: constrainedValue
		})
	}

	private getConstrainedValue(value: string): string {
		let constrainedValue = value;
		let numericValue = parseFloat(value);

		if (!isNaN(numericValue)) {
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
			<div className={"flex py-2 " + (this.props.reverse ? "flex-row-reverse" : "flex-row")}>
				<div className={"flex flex-grow m-2.5 items-center " + (this.props.reverse ? "justify-start" : "justify-end")}>{this.props.label}</div>
				<div className="flex items-center">
					<input className="w-28 text-lg bg-gray-900 px-3 py-1.5 rounded"
						value={this.state.value}
						placeholder={this.props.placeholder ?? ""}
						onChange={(event) => this.onChange(event)}
						onBlur={(event) => this.onFocusOut(event)}/>
				</div>
			</div>
		);
	}
}
