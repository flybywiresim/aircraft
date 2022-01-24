import React, { FC } from 'react';

import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';

import { ArrowLeft, ChevronRight } from 'react-bootstrap-icons';
import { ScrollableContainer } from '../UtilComponents/ScrollableContainer';
import { TabRoutes } from '../Utils/routing';
import { AircraftOptionsPinProgramsPage } from './Pages/AircraftOptionsPinProgramsPage';
import { SimOptionsPage } from './Pages/SimOptionsPage';
import { AtsuAocPage } from './Pages/AtsuAocPage';
import { AudioPage } from './Pages/AudioPage';
import { FlyPadPage } from './Pages/FlyPadPage';

export type ButtonType = {
    name: string,
    setting: string,
}

interface PageLink {
    name: string,
    component: JSX.Element,
}

type SelectionTabsProps = {
    tabs: PageLink[],
}

export const SelectionTabs = ({ tabs }: SelectionTabsProps) => (
    <div className="space-y-6">
        {
            tabs.map((tab) => (
                <Link
                    to={`settings/${tab.name.toLowerCase().replace(/\s/g, '-')}`}
                    className="flex justify-between items-center p-6 bg-theme-secondary rounded-md hover:shadow-lg transition duration-100"
                >
                    <p className="text-2xl">{tab.name}</p>
                    <ChevronRight size={30} />
                </Link>
            ))
        }
    </div>
);

export const Settings = () => {
    const tabs: PageLink[] = [
        { name: 'Aircraft Options / Pin Programs', component: <AircraftOptionsPinProgramsPage /> },
        { name: 'Sim Options', component: <SimOptionsPage /> },
        { name: 'ATSU / AOC', component: <AtsuAocPage /> },
        { name: 'Audio', component: <AudioPage /> },
        { name: 'flyPad', component: <FlyPadPage /> },
    ];

    return (
        <div className="w-full h-efb">
            <Switch>
                <Route exact path="/settings">
                    <h1 className="mb-4 font-bold">Settings</h1>
                    <SelectionTabs tabs={tabs} />
                </Route>
                <TabRoutes basePath="/settings" tabs={tabs} />
            </Switch>
        </div>
    );
};

type SettingsPageProps = {
    name: string,
}

export const SettingsPage: FC<SettingsPageProps> = ({ name, children }) => (
    <div>
        <Link to="/settings" className="inline-block mb-4">
            <div className="flex flex-row items-center space-x-3 hover:text-theme-highlight transition duration-100">
                <ArrowLeft size={30} />
                <h1 className="font-bold text-current">
                    Settings
                    {' - '}
                    {name}
                </h1>
            </div>
        </Link>
        <div className="py-2 px-6 w-full h-efb rounded-lg border-2 border-theme-accent shadow-md">
            <ScrollableContainer height={53}>
                <div className="divide-y-2 divide-theme-accent">
                    {children}
                </div>
            </ScrollableContainer>
        </div>
    </div>
);

type SettingItemProps = {
    name: string,
    unrealistic?: boolean,
    disabled?: boolean,
}

export const SettingItem: FC<SettingItemProps> = ({ name, unrealistic, disabled, children }) => (
    <div className="flex flex-row justify-between items-center py-4">
        <p>
            {name}
            {unrealistic && <span className="ml-2 text-theme-highlight"> (Unrealistic)</span>}
        </p>

        <div className={`${disabled && 'pointer-events-none filter grayscale'}`}>
            {children}
        </div>
    </div>
);
