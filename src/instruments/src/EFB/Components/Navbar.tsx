import React, { useState } from 'react';

export type NavbarProps = {
    tabs: string[]
    selectedIndex: number
    onSelected: (index: number) => void
};

const c = {
    active: 'flex items-center px-4 py-2 text-white bg-white bg-opacity-5 rounded-lg mr-2',
    inactive: 'flex items-center px-4 py-2 text-white hover:bg-white hover:bg-opacity-5 transition duration-300 rounded-lg mr-2',
};

export const Navbar: React.FC<NavbarProps> = ({ tabs, onSelected, selectedIndex }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleClick = (index: number) => {
        // if index state is being provided by selectedIndex, then this set will have no effect
        setActiveIndex(index);
        onSelected(index);
    };

    return (
        <nav className="mt-6">
            <div className="flex justify-between">
                <div className="flex-1 flex items-center justify-start">
                    <div className="flex text-xl">
                        {
                            tabs.map((tab, index) => (
                                // always priotise selectedIndex over activeIndex
                                // - if selectedIndex is undefined, it will revert to active index
                                <a className={index === (selectedIndex || activeIndex) ? c.active : c.inactive} key={tab} onClick={() => handleClick(index)}>
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
