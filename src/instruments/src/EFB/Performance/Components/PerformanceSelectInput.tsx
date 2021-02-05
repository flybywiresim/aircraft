import React from 'react';

type PerformanceSelectInputProps = {
	label: string,
	onChange?: (event: React.FormEvent<HTMLSelectElement>) => void,
	defaultValue?: string | number,
	reverse?: boolean,
};
type PerformanceSelectInputState = {};

export default class PerformanceSelectInput extends React.Component<PerformanceSelectInputProps, PerformanceSelectInputState> {
	render() {
		return (
			<div className={"flex " + (this.props.reverse ? "flex-row-reverse" : "flex-row")}>
				<div className={"flex flex-grow m-2.5 items-center " + (this.props.reverse ? "justify-start" : "justify-end")}>{this.props.label}</div>
				<div className="flex items-center">
					<select className="w-24 bg-gray-900 px-3 py-1.5 rounded" defaultValue={this.props.defaultValue ?? 0} onChange={this.props.onChange}>
						{this.props.children}
					</select>
				</div>
			</div>
		);
	}
}
