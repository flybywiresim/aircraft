import React from 'react';

import { t } from '../translation';
import { Navbar } from '../UtilComponents/Navbar';
import { TODCalculator } from '../TODCalculator/TODCalculator';
import { LandingWidget } from './Widgets/LandingWidget';
import { TabRoutes, PageLink, PageRedirect } from '../Utils/routing';

export const Performance = () => {
    const tabs: PageLink[] = [
        { name: 'Top of Descent', alias: t('Performance.TopOfDescent.Title'), component: <TODCalculator /> },
        { name: 'Landing', alias: t('Performance.Landing.Title'), component: <LandingWidget /> },
    ];

    return (
        <div className="w-full">
            <div className="relative">
                <h1 className="font-bold">{t('Performance.Title')}</h1>
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
};
