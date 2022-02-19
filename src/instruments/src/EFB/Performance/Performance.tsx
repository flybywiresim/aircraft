import React from 'react';

import { Navbar } from '../UtilComponents/Navbar';
import { TODCalculator } from '../TODCalculator/TODCalculator';
import { LandingWidget } from './Widgets/LandingWidget';
import { TabRoutes, PageLink, PageRedirect } from '../Utils/routing';

const tabs: PageLink[] = [
    { name: 'Top of Descent', component: <TODCalculator /> },
    { name: 'Landing', component: <LandingWidget /> },
];

export const Performance = () => (
    <div className="w-full">
        <div className="relative">
            <h1 className="font-bold">Performance</h1>
            <Navbar
                className="absolute top-0 right-0"
                tabs={tabs}
                basePath="/performance"
            />
        </div>
        <div className="mt-4">
            <PageRedirect basePath="/performance" tabs={tabs} />
            <TabRoutes basePath="/performance" tabs={tabs} />
        </div>
    </div>
);
