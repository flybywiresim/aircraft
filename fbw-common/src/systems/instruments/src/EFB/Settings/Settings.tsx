// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC } from 'react';

import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';

import { ArrowLeft, ChevronRight } from 'react-bootstrap-icons';
import { t } from '../Localization/translation';
import { AboutPage } from './Pages/AboutPage';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { PageLink, pathify, TabRoutes } from '../Utils/routing';
import { AircraftOptionsPinProgramsPage } from './Pages/AircraftOptionsPinProgramsPage';
import { SimOptionsPage } from './Pages/SimOptionsPage';
import { RealismPage } from './Pages/RealismPage';
import { AtsuAocPage } from './Pages/AtsuAocPage';
import { AudioPage } from './Pages/AudioPage';
import { FlyPadPage } from './Pages/FlyPadPage';
import { ThirdPartyOptionsPage } from './Pages/ThirdPartyOptionsPage';

export type ButtonType = {
  name: string;
  setting: string;
};

interface SelectionTabsProps {
  tabs: PageLink[];
}

export const SelectionTabs = ({ tabs }: SelectionTabsProps) => (
  <div className="space-y-6">
    {tabs.map((tab) => (
      <Link
        key={tab.name}
        to={`settings/${pathify(tab.name)}`}
        className="flex items-center justify-between rounded-md border-2 border-transparent bg-theme-accent p-6 transition duration-100 hover:border-theme-highlight"
      >
        <p className="text-2xl">{tab.alias ?? tab.name}</p>
        <ChevronRight size={30} />
      </Link>
    ))}
  </div>
);

export const Settings = () => {
  const tabs: PageLink[] = [
    {
      alias: t('Settings.AircraftOptionsPinPrograms.Title'),
      name: 'Aircraft Options / Pin Programs',
      component: <AircraftOptionsPinProgramsPage />,
    },
    { alias: t('Settings.SimOptions.Title'), name: 'Sim Options', component: <SimOptionsPage /> },
    { alias: t('Settings.Realism.Title'), name: 'Realism', component: <RealismPage /> },
    { alias: t('Settings.ThirdPartyOptions.Title'), name: '3rd Party Options', component: <ThirdPartyOptionsPage /> },
    { alias: t('Settings.AtsuAoc.Title'), name: 'ATSU / AOC', component: <AtsuAocPage /> },
    { alias: t('Settings.Audio.Title'), name: 'Audio', component: <AudioPage /> },
    { alias: t('Settings.flyPad.Title'), name: 'flyPad', component: <FlyPadPage /> },
    { alias: t('Settings.About.Title'), name: 'About', component: <AboutPage /> },
  ];

  return (
    <div className="h-content-section-reduced w-full">
      <Switch>
        <Route exact path="/settings">
          <h1 className="mb-4 font-bold">{t('Settings.Title')}</h1>
          <SelectionTabs tabs={tabs} />
        </Route>
        <TabRoutes basePath="/settings" tabs={tabs} />
      </Switch>
    </div>
  );
};

type SettingsPageProps = {
  name: string;
  backRoute?: string;
};

export const SettingsPage: FC<SettingsPageProps> = ({ name, backRoute, children }) => (
  <div>
    <Link to={backRoute ?? '/settings'} className="mb-4 inline-block">
      <div className="flex flex-row items-center space-x-3 transition duration-100 hover:text-theme-highlight">
        <ArrowLeft size={30} />
        <h1 className="font-bold text-current">
          {t('Settings.Title')}
          {' - '}
          {name}
        </h1>
      </div>
    </Link>
    <div className="h-content-section-reduced w-full rounded-lg border-2 border-theme-accent px-6 py-2">
      <ScrollableContainer height={53} innerClassName="h-full">
        <div className="h-full divide-y-2 divide-theme-accent">{children}</div>
      </ScrollableContainer>
    </div>
  </div>
);

export const FullscreenSettingsPage: FC<SettingsPageProps> = ({ name, children }) => (
  <div>
    <Link to="/settings" className="mb-4 inline-block">
      <div className="flex flex-row items-center space-x-3 transition duration-100 hover:text-theme-highlight">
        <ArrowLeft size={30} />
        <h1 className="font-bold text-current">
          {t('Settings.Title')}
          {' - '}
          {name}
        </h1>
      </div>
    </Link>
    <div className="h-content-section-reduced w-full rounded-lg border-2 border-theme-accent px-6 py-2">{children}</div>
  </div>
);

// SettingsGroup wraps several SettingsItems into a group (no divider and closer together).<br/>
// The parent SettingItem should have groupType="parent", any dependent setting should have groupType="sub".
export const SettingGroup: FC = ({ children }) => <div className="py-4">{children}</div>;

type SettingItemProps = {
  name: string;
  unrealistic?: boolean;
  groupType?: 'parent' | 'sub';
  disabled?: boolean;
};

export const SettingItem: FC<SettingItemProps> = ({ name, unrealistic, groupType, disabled, children }) => {
  const UnrealisticHint = () => <span className="ml-2 text-theme-highlight"> ({t('Settings.Unrealistic')})</span>;

  return (
    <div className={`flex flex-row items-center justify-between ${(groupType === undefined && 'py-4') || 'h-12'}`}>
      {groupType === 'sub' ? (
        <span className="ml-6 flex flex-row">
          <span className="ml-2">
            {name}
            {unrealistic && <UnrealisticHint />}
          </span>
        </span>
      ) : (
        <span>
          {name}
          {unrealistic && <UnrealisticHint />}
        </span>
      )}

      <div className={`${disabled && 'pointer-events-none grayscale'}`}>{children}</div>
    </div>
  );
};
