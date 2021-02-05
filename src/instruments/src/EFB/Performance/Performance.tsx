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

import './Assets/Performance.scss';
import TakeoffWidget from './Widgets/TakeoffWidget';
import LandingWidget from './Widgets/LandingWidget';
import { Navbar } from '../Components/Navbar';

type PerformanceProps = {};
type PerformanceState = {
	currentTabIndex: number
};

export default class Performance extends React.Component<PerformanceProps, PerformanceState> {
	constructor(props: PerformanceProps) {
		super(props);

		this.state = {
			currentTabIndex: 0
		}
	}

	private getPage(): JSX.Element | undefined {
		switch (this.state.currentTabIndex) {
			case 0:
				return <TakeoffWidget />
			case 1:
				return <LandingWidget />
		}
	}

	private switchPage(page: number): void {
		this.setState({
			currentTabIndex: page
		})
	}

	public render() {
		return (
			<div className="px-6 pt-2 pb-6 w-full h-full mr-4 flex flex-col">
				<Navbar tabs={["Takeoff", "Landing"]} onSelected={(index) => this.switchPage(index)}></Navbar>

				{this.getPage()}
            </div>
		)
	}
}
