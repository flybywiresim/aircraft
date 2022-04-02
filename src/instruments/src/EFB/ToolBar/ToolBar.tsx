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
import { useTranslation } from 'react-i18next';
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

export const ToolBar = () => {
    const { t } = useTranslation();

    return (
        <nav className="flex flex-col flex-shrink-0 justify-between py-6 w-32">
            <div className="flex flex-col items-center mt-9 space-y-4">
                <ToolBarButton to="/dashboard" tooltipText="Dashboard">
                    <img className="w-[35px]" src={FbwTail} alt="FbwTail" />
                </ToolBarButton>
                <ToolBarButton to="/dispatch" tooltipText={t('Dispatch.Title')}>
                    <Clipboard size={35} />
                </ToolBarButton>
                <ToolBarButton to="/ground" tooltipText={t('Ground.Title')}>
                    <Truck size={35} />
                </ToolBarButton>
                <ToolBarButton to="/performance" tooltipText={t('Performance.Title')}>
                    <Calculator size={35} />
                </ToolBarButton>
                <ToolBarButton to="/navigation" tooltipText={t('NavigationAndCharts.Title')}>
                    <Compass size={35} />
                </ToolBarButton>
                <ToolBarButton to="/atc" tooltipText={t('AirTrafficControl.Title')}>
                    <BroadcastPin size={35} />
                </ToolBarButton>
                <ToolBarButton to="/failures" tooltipText={t('Failures.Title')}>
                    <ExclamationDiamond size={35} />
                </ToolBarButton>
                <ToolBarButton to="/checklists" tooltipText={t('Checklists.Title')}>
                    <JournalCheck size={35} />
                </ToolBarButton>
                <ToolBarButton to="/presets" tooltipText={t('Presets.Title')}>
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
};
