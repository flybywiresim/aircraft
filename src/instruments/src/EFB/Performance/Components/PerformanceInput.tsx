import React from 'react';

type PerformanceInputProps = {
	label: string,
	placeholder?: string,
	onChange?: (event: React.FormEvent<HTMLInputElement>) => void
};
type PerformanceInputState = {};

export default class PerformanceInput extends React.Component<PerformanceInputProps, PerformanceInputState> {
	render() {
		return (
			<div className="input-field">
				<div className="input-label">{this.props.label}</div>
				<div className="input-container">
					<input placeholder={this.props.placeholder ?? ""} onChange={this.props.onChange} />
				</div>
			</div>
		);
	}
}
