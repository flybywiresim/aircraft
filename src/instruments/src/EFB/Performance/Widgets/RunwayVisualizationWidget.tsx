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

import '../../Assets/Performance.scss';

export type DistanceLabel = {
	distance: number,
	label: string
}

type RunwayVisualizationProps = {
	runwayLength?: number,
	labels?: DistanceLabel[],
	runwayNumber?: number
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

	private runwayLengthLabel(): JSX.Element {
		return (
			<div className="text-white absolute top-1/2 -right-3 transform -rotate-90 translate-x-1/2">{ this.props.runwayLength ?? 0 }m</div>
		)
	}

	private getBottomPercentage(label: DistanceLabel): number {
		return (label.distance / this.maxDist()) * 100;
	}

	private runwayNumber(): JSX.Element | undefined {
		if (this.props.runwayNumber) {
			let paddedNumber = this.props.runwayNumber.toString().padStart(2, '0')
			return (
				<div className="runway-id text-white text-4xl absolute left-1/2 bottom-20 transform -translate-x-1/2 opacity-40">{paddedNumber}</div>
			)
		}
	}

	private labels(): JSX.Element[] {
		let elements: JSX.Element[] = [];

		for (let label of this.props.labels ?? []) {
			let bottomPercentage = this.getBottomPercentage(label);

			let closestLabel = (this.props.labels ?? []).reduce((a, b) => {
				if (a.label == label.label) return b;
				if (b.label == label.label) return a;

				return Math.abs(this.getBottomPercentage(b) - bottomPercentage) < Math.abs(this.getBottomPercentage(a) - bottomPercentage) ? b : a
			});

			let showText = (Math.abs(this.getBottomPercentage(closestLabel) - bottomPercentage) > 5);

			elements.push(
				(<div className={"w-32 h-1 bg-white text-white absolute left-1/2 transform -translate-x-1/2 "
					+ ((this.isLabelFurtherThanRunway(label)) ? "error-label" : "")}
					style={{ bottom: `${bottomPercentage}%` }}>

					{showText && ([
						<div className="w-full text-center absolute -top-0.5 transform -translate-y-full">{ label.label }</div>,
						<div className="w-full text-center absolute -bottom-0.5 transform translate-y-full">{ Math.round(label.distance) }m</div>
					])}

				</div>)
			)
		}

		return elements;
	}

	public render() {
		return (
			<div className="px-10 h-full flex flex-col relative">
				<div className="flex-grow bg-red-900 opacity-30"></div>
				<div className="runway w-40 relative"
					style={ { height: `${this.runwayHeightPercentage()}%`}}>
					{this.runwayLengthLabel()}
					<div className="w-1 h-full bg-white opacity-30 absolute left-0"></div>
					<div className="w-1 h-full bg-white opacity-30 absolute right-0"></div>
					<div className="flex absolute left-1/2 bottom-2 transform -translate-x-1/2">
						<div className="mr-2 w-2 h-14 bg-white opacity-30"></div>
						<div className="mr-2 w-2 h-14 bg-white opacity-30"></div>
						<div className="mr-2 w-2 h-14 bg-white opacity-30"></div>
						<div className="mr-5 w-2 h-14 bg-white opacity-30"></div>
						<div className="mr-2 w-2 h-14 bg-white opacity-30"></div>
						<div className="mr-2 w-2 h-14 bg-white opacity-30"></div>
						<div className="mr-2 w-2 h-14 bg-white opacity-30"></div>
						<div className="w-2 h-14 bg-white opacity-30"></div>
					</div>
					<div className="relative h-full overflow-hidden">
						<div className="w-1.5 h-20 bg-white opacity-10 absolute left-1/2 bottom-40 transform -translate-x-1/2"></div>
						<div className="w-1.5 h-20 bg-white opacity-10 absolute left-1/2 bottom-72 transform -translate-x-1/2"></div>
					</div>

					{this.runwayNumber()}
				</div>
				{this.labels()}
            </div>
		)
	}
}
