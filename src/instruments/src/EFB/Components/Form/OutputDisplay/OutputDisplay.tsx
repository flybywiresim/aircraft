import React from 'react';

type OutputDisplayProps = {
	label: string,
	value: string | number,
	error?: boolean,
	reverse?: boolean
};
type OutputDisplayState = {};

export default class OutputDisplay extends React.Component<OutputDisplayProps, OutputDisplayState> {
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
