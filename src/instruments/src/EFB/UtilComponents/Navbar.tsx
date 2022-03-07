import React from 'react';
import { NavLink } from 'react-router-dom';
import { PageLink, pathify } from '../Utils/routing';

interface NavbarProps {
    tabs: PageLink[];
    onSelected?: (index: number) => void;
    className?: string;
    basePath: string;
}

export const Navbar = ({ tabs, className, onSelected, basePath }: NavbarProps) => (
    <nav className={`flex justify-between ${className}`}>
        <div className="flex overflow-hidden rounded-md border border-theme-accent divide-x divide-theme-accent">
            {
                tabs.map((tab, index) => (
                    <NavLink
                        onClick={() => onSelected?.(index)}
                        to={`${basePath}/${pathify(tab.name)}`}
                        className="flex items-center py-2 px-6 bg-opacity-0 hover:bg-opacity-100 transition duration-300"
                        activeClassName="flex items-center px-6 py-2 bg-theme-accent bg-opacity-100"
                        key={tab.name}
                    >
                        {tab.name}
                    </NavLink>
                ))
            }
        </div>
    </nav>
);
