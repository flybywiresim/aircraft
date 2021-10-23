import React, { useState } from 'react';

export type NavbarProps = {
    tabs: string[],
    onSelected: (index: number) => void,
    className?: string,
};

const c = {
    active: 'flex items-center px-6 py-2 bg-theme-accent bg-opacity-100',
    inactive: 'flex items-center px-6 py-2 bg-opacity-0 hover:bg-opacity-100 transition duration-300',
};

export const Navbar = ({ tabs, onSelected, className }: NavbarProps) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleClick = (index: number) => {
        setActiveIndex(index);
        onSelected(index);
    };

    return (
        <nav className={`flex justify-between ${className}`}>
            <div className="flex overflow-hidden rounded-md border divide-x divide-theme-accent border-theme-accent">
                {
                    tabs.map((tab, index) => (
                        <a className={index === activeIndex ? c.active : c.inactive} key={tab} onClick={() => handleClick(index)}>
                            {tab}
                        </a>
                    ))
                }
            </div>
        </nav>
    );
};
