import React from 'react';

import { useTranslation } from 'react-i18next';
import i18next from '../i18n';
import { Navbar } from '../UtilComponents/Navbar';
import { TODCalculator } from '../TODCalculator/TODCalculator';
import { LandingWidget } from './Widgets/LandingWidget';
import { TabRoutes, PageLink, PageRedirect } from '../Utils/routing';

const tabs: PageLink[] = [
    { name: 'Top of Descent', alias: i18next.t('Performance.TopOfDescent.Title'), component: <TODCalculator /> },
    { name: 'Landing', alias: i18next.t('Performance.Landing.Title'), component: <LandingWidget /> },
];

export const Performance = () => {
    const { t } = useTranslation();

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
