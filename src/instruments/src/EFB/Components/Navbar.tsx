import React, { useState } from 'react';

export type NavbarProps = {
    tabs: string[],
    onSelected: (index: number) => void;
};

const c = {
    active: 'flex items-center px-4 py-2 text-white bg-white bg-opacity-5 rounded-lg mr-2',
    inactive: 'flex items-center px-4 py-2 text-white hover:bg-white hover:bg-opacity-5 transition duration-300 rounded-lg mr-2',
};

export const Navbar = (props: NavbarProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleClick = (index: number) => {
        setActiveIndex(index);
        props.onSelected(index);
    };

    return (
        <nav className="mt-6">
            <div className="flex justify-between">
                <div className="flex-1 flex items-center justify-start">
                    <div className="flex text-xl">
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
