import React, { FC } from 'react';
import {
    Clipboard,
    Truck,
    Compass,
    BroadcastPin,
    ExclamationDiamond,
    Gear,
    Calculator,
    JournalCheck,
    Sliders,
} from 'react-bootstrap-icons';
import { NavLink } from 'react-router-dom';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';

// @ts-ignore
import FbwTail from '../Assets/FBW-Tail.svg';

interface ToolBarButtonProps {
    to: string;
    tooltipText: string;
}

const ToolBarButton: FC<ToolBarButtonProps> = ({ to, tooltipText, children }) => (
    <TooltipWrapper text={tooltipText}>
        <NavLink
            to={to}
            activeClassName="bg-theme-accent !text-theme-text"
            className="flex justify-center items-center py-3.5 px-3.5 rounded-md transition duration-100 text-theme-unselected hover:text-theme-text hover:bg-theme-accent"
        >
            {children}
        </NavLink>
    </TooltipWrapper>
);

export const ToolBar = () => (
    <nav className="flex flex-col flex-shrink-0 justify-between py-6 w-32">
        <div className="flex flex-col items-center mt-9 space-y-4">
            <ToolBarButton to="/dashboard" tooltipText="Dashboard">
                <img className="w-[35px]" src={FbwTail} alt="FbwTail" />
            </ToolBarButton>
            <ToolBarButton to="/dispatch" tooltipText="Dispatch">
                <Clipboard size={35} />
            </ToolBarButton>
            <ToolBarButton to="/ground" tooltipText="Ground">
                <Truck size={35} />
            </ToolBarButton>
            <ToolBarButton to="/performance" tooltipText="Performance">
                <Calculator size={35} />
            </ToolBarButton>
            <ToolBarButton to="/navigation" tooltipText="Navigation & Charts">
                <Compass size={35} />
            </ToolBarButton>
            <ToolBarButton to="/atc" tooltipText="Air Traffic Control">
                <BroadcastPin size={35} />
            </ToolBarButton>
            <ToolBarButton to="/failures" tooltipText="Failures">
                <ExclamationDiamond size={35} />
            </ToolBarButton>
            <ToolBarButton to="/checklists" tooltipText="Checklists">
                <JournalCheck size={35} />
            </ToolBarButton>
            <ToolBarButton to="/presets" tooltipText="Presets">
                <Sliders size={35} />
            </ToolBarButton>
        </div>

        <div className="flex flex-col items-center">
            <div className="my-4 w-14 h-1.5 rounded-full bg-theme-accent" />
            <ToolBarButton to="/settings" tooltipText="Settings">
                <Gear color="currentColor" size={35} />
            </ToolBarButton>
        </div>
    </nav>
);
