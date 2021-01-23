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

type ToolbarProps = {
    setPageIndex: (number) => void;
};

type ToolbarState = {
    activeIndex: number;
};

class ToolBar extends React.Component<ToolbarProps, ToolbarState> {
    constructor(props: ToolbarProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    tabs = [
        { id: 0, name: 'Dashboard', link: 'dashboard'},
        { id: 1, name: 'Dispatch', link: 'dispatch'},
        { id: 2, name: 'Flight', link: 'flight' },
        { id: 3, name: 'Performance', link: 'performance'},
        { id: 4, name: 'Company', link: 'company'},
        { id: 5, name: 'Ground', link: 'ground'},
    ];

    state: ToolbarState = {
        activeIndex: this.indexInit(),
    };

    indexInit(): number {
        const url = window.location.pathname;
        let index = 0;
        this.tabs.map((tab) => {
            if (("/" + tab.link) === url) {
                index = tab.id;
            } else if (url === "/") {
                index = 0;
            }
        });
        return index;
    }

    handleClick(index: number) {
        return (() => {
            this.setState({activeIndex: index });
            this.props.setPageIndex(index);
        });
    }

    render() {
        return (
            <nav className="bg-gray-800">
                <div className="flex justify-between py-3 px-6">
                    <div className="flex-1 flex items-center justify-start">
                        <div className="flex-shrink-0 flex items-center">
                            <img className="h-20 mr-6" src={logo} />
                        </div>
                        <div className="flex space-x-4 text-xl">
                            {
                                this.tabs.map((tab) =>
                                    <a className={tab.id === this.state.activeIndex ? 'border-b-2 border-t-0 border-r-0 border-l-0 text-white px-3 py-2 font-medium' : 'text-white px-3 py-2 font-medium'} key={tab.id} onClick={this.handleClick(tab.id)}>
                                        {tab.name}
                                    </a>
                                )
                            }
                        </div>
                    </div>
                    <div className="flex items-center text-white">
                        <div>
                            <a onClick={this.handleClick(5)}>
                                <IconSettings size={25} stroke={1.5} strokeLinejoin="miter" />
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
}

export default ToolBar;
