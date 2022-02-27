import React, { FC } from 'react';
import {
    Clipboard,
    Truck,
    Compass,
    BroadcastPin,
    ExclamationDiamond,
    Gear,
    Calculator,
    JournalCheck, HouseDoor, FileEarmarkCode, Sliders,
} from 'react-bootstrap-icons';
import { NavLink } from 'react-router-dom';

export const ToolBar = () => (
    <nav className="flex overflow-hidden flex-col flex-shrink-0 justify-between w-32">
        <div className="flex flex-col items-center mt-11">
            <ToolBarButton to="/dashboard">
                <HouseDoor size={35} />
            </ToolBarButton>
            <ToolBarButton to="/dispatch">
                <Clipboard size={35} />
            </ToolBarButton>
            <ToolBarButton to="/ground">
                <Truck size={35} />
            </ToolBarButton>
            <ToolBarButton to="/performance">
                <Calculator size={35} />
            </ToolBarButton>
            <ToolBarButton to="/navigation">
                <Compass size={35} />
            </ToolBarButton>
            <ToolBarButton to="/atc">
                <BroadcastPin size={35} />
            </ToolBarButton>
            <ToolBarButton to="/failures">
                <ExclamationDiamond size={35} />
            </ToolBarButton>
            <ToolBarButton to="/checklists">
                <JournalCheck size={35} />
            </ToolBarButton>
            <ToolBarButton to="/presets">
                <Sliders size={35} />
            </ToolBarButton>
        </div>

        <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-1.5 bg-theme-accent rounded-full" />
            <ToolBarButton to="/settings">
                <Gear color="currentColor" size={35} />
            </ToolBarButton>
        </div>
    </nav>
);

interface ToolBarButtonProps {
    to: string;
}

const toolbarClassName = (active: boolean) => `${active
    ? 'bg-theme-accent text-theme-text'
    : 'text-theme-unselected'} flex w-min items-center justify-center hover:text-theme-text hover:bg-theme-accent transition duration-100 py-3.5 px-3.5 rounded-md mt-4`;

const ToolBarButton: FC<ToolBarButtonProps> = ({ to, children }) => (
    <NavLink
        to={to}
        activeClassName={toolbarClassName(true)}
        className={toolbarClassName(false)}
    >
        {children}
    </NavLink>
);
