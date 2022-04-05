import React from 'react';

import { useTranslation } from 'react-i18next';
import { OverviewPage } from './Pages/OverviewPage';
import { LoadSheetWidget } from './Pages/LoadsheetPage';
import { Navbar } from '../UtilComponents/Navbar';
import { TabRoutes, PageLink, PageRedirect } from '../Utils/routing';

export const Dispatch = () => {
    const { t } = useTranslation();

    const tabs: PageLink[] = [
        { name: 'OFP', alias: t('Dispatch.Ofp.Title'), component: <LoadSheetWidget /> },
        { name: 'Overview', alias: t('Dispatch.Overview.Title'), component: <OverviewPage /> },
    ];

    return (
        <div className="w-full">
            <div className="relative mb-4">
                <h1 className="font-bold">{t('Dispatch.Title')}</h1>
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
