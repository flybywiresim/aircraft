// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

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
import { t } from '../Localization/translation';
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
      className="flex items-center justify-center rounded-md p-3.5 text-theme-unselected transition duration-100 hover:bg-theme-accent hover:text-theme-text"
    >
      {children}
    </NavLink>
  </TooltipWrapper>
);

export const ToolBar = () => (
  <nav className="flex w-32 shrink-0 flex-col justify-between py-6">
    <div className="mt-9 flex flex-col items-center space-y-4">
      <ToolBarButton to="/dashboard" tooltipText={t('Dashboard.Title')}>
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
      <div className="my-4 h-1.5 w-14 rounded-full bg-theme-accent" />
      <ToolBarButton to="/settings" tooltipText={t('Settings.Title')}>
        <Gear color="currentColor" size={35} />
      </ToolBarButton>
    </div>
  </nav>
);
