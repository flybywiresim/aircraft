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

import React, { useState } from 'react';

export type NavbarProps = {
    tabs: string[],
    onSelected: (index: number) => void;
};

const c = {
    active: 'border-b-2 text-white px-3 pb-2 font-medium',
    inactive: 'text-white hover:text-blue-light px-3 pb-2 font-medium transition duration-300',
};

export const Navbar = (props: NavbarProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleClick = (index: number) => {
        setActiveIndex(index);
        props.onSelected(index);
    };

    return (
        <nav className="bg-none">
            <div className="flex justify-between p-6">
                <div className="flex-1 flex items-center justify-start">
                    <div className="flex space-x-4 text-xl">
                        {
                            props.tabs.map((tab, index) => (
                                <a className={index === activeIndex ? c.active : c.inactive} key={tab} onClick={() => handleClick(index)}>
                                    {tab}
                                </a>
                            ))
                        }
                    </div>
                </div>
            </div>
        </nav>
    );
};
