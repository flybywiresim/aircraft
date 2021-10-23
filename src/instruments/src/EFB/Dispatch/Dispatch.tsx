import React from 'react';

import { useHistory } from 'react-router-dom';
import { OverviewPage } from './Pages/OverviewPage';
import { LoadSheetWidget } from './Pages/LoadsheetPage';
import { Navbar } from '../Components/Navbar';
import { FuelPage } from './Pages/FuelPage';
import { TabRoutes, PageLink, pathify, PageRedirect } from '../Utils/routing';

export const Dispatch = () => {
    const history = useHistory();
    const tabs: PageLink[] = [
        { name: 'Overview', component: <OverviewPage /> },
        { name: 'OFP', component: <LoadSheetWidget /> },
        { name: 'Fuel', component: <FuelPage /> },
    ];

    return (
        <div className="w-full">
            <div className="relative">
                <h1 className="font-bold">Dispatch</h1>
                <Navbar
                    className="absolute top-0 right-0"
                    tabs={tabs.map((tab) => tab.name)}
                    onSelected={(index) => history.push(`/dispatch/${pathify(tabs[index].name)}`)}
                />
            </div>
            <PageRedirect basePath="/dispatch" tabs={tabs} />
            <TabRoutes basePath="/dispatch" tabs={tabs} />
        </div>
    );
};
