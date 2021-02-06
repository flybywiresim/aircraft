import React from 'react';

type PerformanceInputProps = {
	label: string,
	placeholder?: string,
	onChange?: (event: React.FormEvent<HTMLInputElement>) => void,
	reverse?: boolean
};
type PerformanceInputState = {};

export default class PerformanceInput extends React.Component<PerformanceInputProps, PerformanceInputState> {
	render() {
		return (
			<div className={"flex py-2 " + (this.props.reverse ? "flex-row-reverse" : "flex-row")}>
				<div className={"flex flex-grow m-2.5 items-center " + (this.props.reverse ? "justify-start" : "justify-end")}>{this.props.label}</div>
				<div className="flex items-center">
					<input className="w-28 text-lg bg-gray-900 px-3 py-1.5 rounded" placeholder={this.props.placeholder ?? ""} onChange={this.props.onChange} />
				</div>
			</div>
		);
	}
}
