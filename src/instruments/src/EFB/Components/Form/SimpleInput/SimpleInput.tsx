import React from 'react';

type SimpleInputProps = {
	label: string,
	placeholder?: string,
	onChange?: (value: string) => void,
	reverse?: boolean // Flip label/input order
};
type SimpleInputState = {};

export default class SimpleInput extends React.Component<SimpleInputProps, SimpleInputState> {
	render() {
		return (
			<div className={"flex py-2 " + (this.props.reverse ? "flex-row-reverse" : "flex-row")}>
				<div className={"flex flex-grow m-2.5 items-center " + (this.props.reverse ? "justify-start" : "justify-end")}>{this.props.label}</div>
				<div className="flex items-center">
					<input className="w-28 text-lg bg-gray-900 px-3 py-1.5 rounded" placeholder={this.props.placeholder ?? ""} onChange={(event) => this.props.onChange?.(event.currentTarget.value)} />
				</div>
			</div>
		);
	}
}
