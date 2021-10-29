import React, { useState } from 'react';
import { IconClipboard, IconMap, IconCalculator, IconSettings, IconTruck, IconBuildingLighthouse, IconAlertTriangle } from '@tabler/icons';
import logo from '../Assets/fbw-logo.svg';

type ToolbarProps = {
    setPageIndex: (index) => void;
};

const c = {
    active: 'py-4 bg-white bg-opacity-5 py-4 mx-5 rounded-lg mt-2',
    inactive: 'hover:bg-white hover:bg-opacity-5 transition duration-300 py-4 mx-5 rounded-lg mt-2',
};

const ToolBar = (props: ToolbarProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    function handleClick(index: number) {
        setActiveIndex(index);
        props.setPageIndex(index);
    }

    return (
        <nav className="overflow-hidden bg-navy-lighter w-32 justify-between flex flex-col -mx-1">
            <div className="mt-14">
                <ul>
                    <li className={activeIndex === 0 ? c.active : c.inactive}>
                        <a onClick={() => handleClick(0)}>
                            <img src={logo} alt="FlyByWire" className="w-10 py-2 mx-auto" />
                        </a>
                    </li>
                    <li className={activeIndex === 1 ? c.active : c.inactive}>
                        <a onClick={() => handleClick(1)}>
                            <IconClipboard className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                        </a>
                    </li>
                    <li className={activeIndex === 2 ? c.active : c.inactive}>
                        <a onClick={() => handleClick(2)}>
                            <IconTruck className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                        </a>
                    </li>
                    <li className={activeIndex === 3 ? c.active : c.inactive}>
                        <a onClick={() => handleClick(3)}>
                            <IconCalculator className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                        </a>
                    </li>
                    <li className={activeIndex === 4 ? c.active : c.inactive}>
                        <a onClick={() => handleClick(4)}>
                            <IconMap className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                        </a>
                    </li>
                    <li className={activeIndex === 5 ? c.active : c.inactive}>
                        <a onClick={() => handleClick(5)}>
                            <IconBuildingLighthouse className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                        </a>
                    </li>
                    <li className={activeIndex === 7 ? c.active : c.inactive}>
                        <a onClick={() => handleClick(7)}>
                            <IconAlertTriangle className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                        </a>
                    </li>
                </ul>
            </div>

            <div className="mb-6">
                <div className="mx-6 border-t-2 border-gray-700 mt-6" />
                <div className={activeIndex === 6 ? `${c.active} mt-6` : `${c.inactive} mt-6`} onClick={() => handleClick(6)}>
                    <IconSettings className="mx-auto" size={45} color="white" stroke={1} strokeLinejoin="miter" />
                </div>
            </div>
        </nav>
    );
};

export default ToolBar;
