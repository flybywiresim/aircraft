import React, { ReactElement, useEffect, useState } from 'react';

export type NavbarProps = {
    tabs: string[] | ReactElement[];
    selectedTabIndex?: number;
    onSelected: (index: number) => void;
    className?: string;
};

const c = {
    active: 'flex items-center px-6 py-2 bg-theme-accent bg-opacity-100',
    inactive: 'flex items-center px-6 py-2 bg-opacity-0 hover:bg-opacity-100 transition duration-300',
};

export const Navbar = ({ tabs, onSelected, className, selectedTabIndex }: NavbarProps) => {
    const [activeIndex, setActiveIndex] = useState(selectedTabIndex === undefined ? 0 : selectedTabIndex);

    useEffect(() => {
        setActiveIndex(selectedTabIndex || 0);
    }, [activeIndex, selectedTabIndex]);

    const handleClick = (index: number) => {
        setActiveIndex(index);
        onSelected(index);
    };

    return (
        <nav className={`flex justify-between ${className}`}>
            <div className="flex overflow-hidden rounded-md border divide-x divide-theme-accent border-theme-accent">
                {tabs.map((tab, index) => (
                    <a
                        className={index === activeIndex ? c.active : c.inactive}
                        key={tab}
                        onClick={() => handleClick(index)}
                    >
                        {tab}
                    </a>
                ))}
            </div>
        </nav>
    );
};
