import React from 'react';
import classNames from 'classnames';

type PerformanceOutputDisplayProps = {
	label: string,
	value: string | number,
	error?: boolean
};
type PerformanceOutputDisplayState = {};

export default class PerformanceOutputDisplay extends React.Component<PerformanceOutputDisplayProps, PerformanceOutputDisplayState> {
	render() {
		return (
			<div className="output-field">
				<div className="output-label">{this.props.label}</div>
				<div className="output-container">
					<input disabled className={classNames({disabled: true, error: this.props.error})} value={this.props.value}></input>
				</div>
			</div>
		);
	}
}
