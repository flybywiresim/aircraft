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
