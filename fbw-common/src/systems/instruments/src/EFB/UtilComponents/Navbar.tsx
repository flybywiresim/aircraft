// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

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
    <div className="divide-theme-accent border-theme-accent flex divide-x overflow-hidden rounded-md border">
      {tabs.map((tab, index) => (
        <NavLink
          onClick={() => onSelected?.(index)}
          to={`${basePath}/${pathify(tab.name)}`}
          className="flex items-center bg-opacity-0 px-6 py-2 transition duration-300 hover:bg-opacity-100"
          activeClassName="flex items-center px-6 py-2 bg-theme-accent bg-opacity-100"
          key={tab.name}
        >
          {tab.alias ?? tab.name}
        </NavLink>
      ))}
    </div>
  </nav>
);
