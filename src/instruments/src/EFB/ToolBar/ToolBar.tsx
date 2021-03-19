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
import { IconClipboard, IconMap, IconTool, IconCalculator, IconSettings, IconTruck } from '@tabler/icons';
import logo from '../Assets/fbw-logo.svg';

type ToolbarProps = {
    setPageIndex: (index) => void;
};

type ToolbarState = {
    activeIndex: number;
};

const c = {
    active: 'cursor-pointer py-4 bg-white bg-opacity-5 py-4 mx-5 rounded-lg mt-2',
    inactive: 'cursor-pointer hover:bg-white hover:bg-opacity-5 transition duration-300 ease-in-out py-4 mx-5 rounded-lg mt-2',
};

class ToolBar extends React.Component<ToolbarProps, ToolbarState> {
    constructor(props: ToolbarProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);

        this.state = { activeIndex: 0 };
    }

    handleClick(index: number) {
        this.setState({ activeIndex: index });
        this.props.setPageIndex(index);
    }

    render() {
        return (
            <nav className="overflow-hidden bg-navy-lighter w-32 justify-between flex flex-col -mx-1">
                <div className="mt-14">
                    <ul>
                        <li className={this.state.activeIndex === 0 ? c.active : c.inactive}>
                            <a onClick={() => this.handleClick(0)}>
                                <img src={logo} alt="FlyByWire logo" className="w-10 py-2 mx-auto" />
                            </a>
                        </li>
                        <li className={this.state.activeIndex === 1 ? c.active : c.inactive}>
                            <a onClick={() => this.handleClick(1)}>
                                <IconClipboard className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                            </a>
                        </li>
                        <li className={this.state.activeIndex === 2 ? c.active : c.inactive}>
                            <a onClick={() => this.handleClick(2)}>
                                <IconTruck className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                            </a>
                        </li>
                        <li className={this.state.activeIndex === 3 ? c.active : c.inactive}>
                            <a onClick={() => this.handleClick(3)}>
                                <IconCalculator className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                            </a>
                        </li>
                        <li className={this.state.activeIndex === 4 ? c.active : c.inactive}>
                            <a onClick={() => this.handleClick(4)}>
                                <IconMap className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                            </a>
                        </li>
                        <li className={this.state.activeIndex === 5 ? c.active : c.inactive}>
                            <a onClick={() => this.handleClick(5)}>
                                <IconTool className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="mb-6">
                    <div className="mx-6 border-t-2 border-gray-700 mt-6" />
                    <div className={this.state.activeIndex === 6 ? `${c.active} mt-6` : `${c.inactive} mt-6`} onClick={() => this.handleClick(6)}>
                        <IconSettings className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                    </div>
                </div>
            </nav>
        );
    }
}

export default ToolBar;
