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
import FlexWidget from './Widgets/LandingWidget';
import TakeoffWidget from './Widgets/TakeoffWidget';

import './Assets/Performance.scss';

type PerformanceProps = {};
type PerformanceState = {};

export default class Performance extends React.Component<PerformanceProps, PerformanceState> {
	public render() {
		return (
			<div className="flex p-6 w-full">
				<div className="performance-widgets w-full">
					<div className="performance-widget-container w-4/12 mr-4">
						<h1 className="text-white font-medium mb-6 text-xl">Takeoff</h1>
						<TakeoffWidget />
					</div>
					<div className="performance-widget-container w-4/12 mr-4">
						<h1 className="text-white font-medium mb-6 text-xl">Landing</h1>
						<FlexWidget />
					</div>
				</div>
            </div>
		)
	}
}
