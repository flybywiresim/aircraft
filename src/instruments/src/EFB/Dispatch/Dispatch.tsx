import React from 'react';

import { OverviewPage } from './Pages/OverviewPage';
import { LoadSheetWidget } from './Pages/LoadsheetPage';
import { Navbar } from '../UtilComponents/Navbar';
import { TabRoutes, PageLink, PageRedirect } from '../Utils/routing';

export const Dispatch = () => {
    const tabs: PageLink[] = [
        { name: 'Overview', component: <OverviewPage /> },
        { name: 'OFP', component: <LoadSheetWidget /> },
    ];

    return (
        <div className="w-full">
            <div className="relative mb-4">
                <h1 className="font-bold">Dispatch</h1>
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
