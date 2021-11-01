import React, { useState } from 'react';

import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';

import { ChevronRight } from 'react-bootstrap-icons';

import { FlyPadPage } from './Pages/FlyPadPage';
import { AtsuAocPage } from './Pages/AtsuAocPage';
import { AircraftConfigurationPage } from './Pages/AircraftConfigurationPage';
import { DefaultsPage } from './Pages/DefaultsPage';
import { AudioPage } from './Pages/AudioPage';
import { SimOptionsPage } from './Pages/SimOptionsPage';

export type ButtonType = {
    name: string,
    setting: string,
}

interface SettingsNavbarContextInterface {
    showNavbar: boolean,
    setShowNavbar: (newValue: boolean) => void
}

export const SettingsNavbarContext = React.createContext<SettingsNavbarContextInterface>(undefined as any);

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
                    className="flex justify-between items-center p-6 rounded-md hover:shadow-lg transition duration-200 bg-theme-secondary"
                >
                    <p className="text-2xl">{tab.name}</p>
                    <ChevronRight size={30} />
                </Link>
            ))
        }
    </div>
);

export const Settings = () => {
    const [showNavbar, setShowNavbar] = useState(true);

    const tabs: PageLink[] = [
        { name: 'Defaults', component: <DefaultsPage /> },
        { name: 'Aircraft Configuration', component: <AircraftConfigurationPage /> },
        { name: 'Sim Options', component: <SimOptionsPage /> },
        { name: 'ATSU AOC', component: <AtsuAocPage /> },
        { name: 'Audio', component: <AudioPage /> },
        { name: 'flyPad', component: <FlyPadPage /> },
    ];

    return (
        <SettingsNavbarContext.Provider value={{ showNavbar, setShowNavbar }}>
            <div className="w-full h-efb">
                <Switch>
                    <Route exact path="/settings">
                        <h1 className="mb-4 ">Settings</h1>
                        <SelectionTabs tabs={tabs} />
                    </Route>
                    {tabs.map((tab) => (
                        <Route path={`/settings/${tab.name.toLowerCase().replace(/\s/g, '-')}`}>
                            <div className="mt-4">
                                {tab.component}
                            </div>
                        </Route>
                    ))}
                </Switch>
            </div>
        </SettingsNavbarContext.Provider>
    );
};
