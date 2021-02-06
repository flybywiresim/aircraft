import React from 'react';

type PerformanceOutputDisplayProps = {
	label: string,
	value: string | number,
	error?: boolean,
	reverse?: boolean
};
type PerformanceOutputDisplayState = {};

export default class PerformanceOutputDisplay extends React.Component<PerformanceOutputDisplayProps, PerformanceOutputDisplayState> {
	render() {
		return (
			<div className="mx-2 flex-1">
				<div className="flex justify-center text-center items-center mx-6 my-2">{this.props.label}</div>
				<div className="flex justify-center items-center">
					<input disabled className={"w-24 px-3 py-1.5 text-lg rounded disabled text-center " + (this.props.error ? "error" : "")} value={this.props.value}></input>
				</div>
			</div>
		);
	}
}
