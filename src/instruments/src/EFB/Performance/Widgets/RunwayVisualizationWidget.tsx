/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';

import '../Assets/Performance.scss';

export type DistanceLabel = {
	distance: number,
	label: string
}

type RunwayVisualizationProps = {
	runwayLength?: number,
	labels?: DistanceLabel[]
};
type RunwayVisualizationState = {};

export default class RunwayVisualizationWidget extends React.Component<RunwayVisualizationProps, RunwayVisualizationState> {
	constructor(props: RunwayVisualizationProps) {
		super(props);
	}

	private runwayHeightPercentage(): number {
		let runwayLength = this.props.runwayLength ?? 0;
		let maxDist = this.maxDist();

		if (runwayLength == 0 || maxDist == 0) {
			return 100;
		}
		let percentage = (runwayLength / this.maxDist()) * 100;

		return Math.max(percentage, 20);
	}

	private maxDist(): number {
		let runwayLength = this.props.runwayLength ??  0;

		let distances = this.props.labels?.map(label => label.distance) ?? [];

		return Math.max(runwayLength, ...distances);
	}

	private isLabelFurtherThanRunway(label: DistanceLabel): boolean {
		return label.distance > (this.props.runwayLength ?? 0);
	}

	private runwayLengthLabel(): JSX.Element | undefined {
		if (this.props.runwayLength) {
			return (
				<div className="text-white absolute top-1/2 -right-3 transform -rotate-90 translate-x-1/2">{ this.props.runwayLength }m</div>
			)
		}
	}

	private labels(): JSX.Element[] {
		let elements: JSX.Element[] = [];

		for (let label of this.props.labels ?? []) {
			let bottomPercentage = (label.distance / this.maxDist()) * 100;

			elements.push(
				(<div className={"w-40 h-1 bg-white text-white absolute left-1/2 transform -translate-x-1/2 "
					+ ((this.isLabelFurtherThanRunway(label)) ? "error-label" : "")}
					style={{ bottom: `${bottomPercentage}%` }}>
					<div className="w-full text-center absolute -top-0.5 transform -translate-y-full">{ label.label }</div>
					<div className="w-full text-center absolute -bottom-0.5 transform translate-y-full">{ Math.round(label.distance) }m</div>
				</div>)
			)
		}

		return elements;
	}

	public render() {
		return (
			<div className="px-10 h-full flex flex-col relative">
				<div className="flex-grow bg-red-900 opacity-30"></div>
				<div className="w-48 bg-black relative"
					style={ { height: `${this.runwayHeightPercentage()}%`}}>
					{this.runwayLengthLabel()}
					<div className="w-1 h-full bg-white opacity-40 absolute left-0"></div>
					<div className="w-1 h-full bg-white opacity-40 absolute right-0"></div>
					<div className="flex absolute left-1/2 bottom-10 transform -translate-x-1/2">
						<div className="mr-5 w-6 h-20 bg-white opacity-40"></div>
						<div className="mr-5 w-6 h-20 bg-white opacity-40"></div>
						<div className="w-6 h-20 bg-white opacity-40"></div>
					</div>
				</div>
				{this.labels()}
            </div>
		)
	}
}
