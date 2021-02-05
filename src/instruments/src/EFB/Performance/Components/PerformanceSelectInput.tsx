import React from 'react';

type PerformanceSelectInputProps = {
	label: string,
	onChange?: (event: React.FormEvent<HTMLSelectElement>) => void,
	defaultValue?: string | number
};
type PerformanceSelectInputState = {};

export default class PerformanceSelectInput extends React.Component<PerformanceSelectInputProps, PerformanceSelectInputState> {
	render() {
		return (
			<div className="input-field">
				<div className="input-label">{this.props.label}</div>
				<div className="input-container">
					<select defaultValue={this.props.defaultValue ?? 0} onChange={this.props.onChange}>
						{this.props.children}
					</select>
				</div>
			</div>
		);
	}
}
