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
import { IconSettings } from '@tabler/icons';
import logo from '../Assets/fbw-logo.svg';
import { Navbar } from '../Components/Navbar';

type ToolbarProps = {
    setPageIndex: (number) => void;
};

type ToolbarState = {
    activeIndex: number;
};

class ToolBar extends React.Component<ToolbarProps, ToolbarState> {
    tabs = [
        'Dashboard',
        'Dispatch',
        'Flight',
        'Performance',
        'Company',
        'Ground',
    ];

    constructor(props: ToolbarProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(index: number) {
        this.props.setPageIndex(index);
    }

    render() {
        return (
            <nav className="bg-gray-800">
                <div className="flex justify-start py-3 px-6">
                    <div className="flex-shrink-0 flex items-center">
                        <img className="h-20" src={logo} />
                    </div>
                    <Navbar tabs={this.tabs} onSelected={(index) => this.handleClick(index)} />
                    <div className="ml-auto flex items-center text-white">
                        <div>
                            <a onClick={() => this.handleClick(6)}>
                                <IconSettings className="hover:text-blue-light" size={30} stroke={1.5} strokeLinejoin="miter" />
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
}

export default ToolBar;
