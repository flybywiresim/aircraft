import React from 'react';

import { OverviewPage } from './Pages/OverviewPage';
import { LoadSheetWidget } from './Pages/LoadsheetPage';
import { Navbar } from '../UtilComponents/Navbar';
import { FuelPage } from './Pages/FuelPage';
import { TabRoutes, PageLink, PageRedirect } from '../Utils/routing';

export const Dispatch = () => {
    const tabs: PageLink[] = [
        { name: 'Overview', component: <OverviewPage /> },
        { name: 'OFP', component: <LoadSheetWidget /> },
        { name: 'Fuel', component: <FuelPage /> },
    ];

    return (
        <div className="w-full">
            <div className="relative">
                <h1 className="font-bold text-[#ff0ff]">Dispatch</h1>
                <Navbar
                    className="absolute top-0 right-0"
                    tabs={tabs}
                    basePath="/dispatch"
                />
            </div>
            <PageRedirect basePath="/dispatch" tabs={tabs} />
            <TabRoutes basePath="/dispatch" tabs={tabs} />
        </div>
    );
};
