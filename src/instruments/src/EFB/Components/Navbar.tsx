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

import { IconBriefcase, IconClipboard, IconMap, IconPlane, IconTool } from "@tabler/icons";
import React, { useState } from "react";
import logo from '../Assets/fbw-tail.png';

export type NavbarProps = {
    onSelected: (index: number) => void;
};

const c = {
    active: "cursor-pointer py-4 bg-white bg-opacity-5 py-4 mx-5 rounded-lg mt-2",
    inactive: "cursor-pointer hover:bg-white hover:bg-opacity-5 transition duration-300 ease-in-out py-4 mx-5 rounded-lg mt-2"
};

export const Navbar = (props: NavbarProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleClick = (index: number) => {
        setActiveIndex(index);
        props.onSelected(index);
    }

    return (
        <ul>
            <li className={0 === activeIndex ? c.active : c.inactive}>
                <a onClick={() => handleClick(0)}>
                    <img src={logo} className="w-10 py-2 mx-auto" />
                </a>
            </li>
            <li className={1 === activeIndex ? c.active : c.inactive}>
                <a onClick={() => handleClick(1)}>
                    <IconBriefcase className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                </a>
            </li>
            <li className={2 === activeIndex ? c.active : c.inactive}>
                <a onClick={() => handleClick(2)}>
                    <IconClipboard className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                </a>
            </li>
            <li className={3 === activeIndex ? c.active : c.inactive}>
                <a onClick={() => handleClick(3)}>
                    <IconMap className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                </a>
            </li>
            <li className={4 === activeIndex ? c.active : c.inactive}>
                <a onClick={() => handleClick(4)}>
                    <IconPlane className="transform -rotate-45 mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                </a>
            </li>
            <li className={5 === activeIndex ? c.active : c.inactive}>
                <a onClick={() => handleClick(5)}>
                    <IconTool className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                </a>
            </li>
        </ul>

        /**
        <nav className="bg-none">
            <div className="flex justify-between p-6">
                <div className="flex-1 flex items-center justify-start">
                    <div className="flex space-x-4 text-xl">
                        {
                            props.tabs.map((tab, index) =>
                                <a className={index === activeIndex ? c.active : c.inactive} key={tab} onClick={() => handleClick(index)}>
                                    {tab}
                                </a>
                            )
                        }
                    </div>
                </div>
            </div>
        </nav> **/
    );
};
