/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
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
import { IconUser } from '@tabler/icons';

type ToolbarProps = {
    setPageIndex: (number) => void;
    fetchSimbrief: Function;
    logo: string,
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
        { id: 1, name: 'Loadsheet', link: 'loadsheet'},
        { id: 2, name: 'Flight', link: 'flight' },
        { id: 3, name: 'Ground', link: 'ground'},
        { id: 4, name: 'Multiplayer', link: 'multiplayer' },
        { id: 5, name: 'Settings', link: 'settings' }
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
                index = 1;
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
            <div className="Toolbar">
                <img src={this.props.logo} className="FBW-Logo" alt="logo" />

                <div id="Tabs">
                    {
                        this.tabs.map((tab) =>
                            <div key={tab.id} className={tab.id === this.state.activeIndex ? 'Tab Active' : 'Tab'} onClick={this.handleClick(tab.id)}>
                                <a href={"/" + tab.link}>{tab.name}</a>
                            </div>
                        )
                    }

                    <div id="LoadSimbrief" className="Tab">
                        <a onClick={() => this.props.fetchSimbrief()}>
                            Load Flight Data
                        </a>
                    </div>
                </div>

                <div id="ProfileToolbar">
                    <a href={"/profile"}>
                        <IconUser size={35} stroke={1.5} strokeLinejoin="miter" />
                    </a>
                    {/*<Link to="/profile">*/}
                    {/*    <i className="material-icons" id="Icon">account_circle</i>*/}
                    {/*</Link>*/}
                </div>
            </div>
        );
    }
}

export default ToolBar;
