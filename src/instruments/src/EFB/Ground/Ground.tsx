import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageLink, PageRedirect, TabRoutes } from '../Utils/routing';
import { Navbar } from '../UtilComponents/Navbar';
import { ServicesPage } from './Pages/ServicesPage';
import { PushbackPage } from './Pages/PushbackPage';
import { FuelPage } from './Pages/FuelPage';
import { store, RootState } from '../Store/store';

export interface StatefulButton {
    id: string,
    state: string,
    callBack,
    value: number,
}

const BUTTON_STYLE_INACTIVE = ' hover:bg-theme-highlight text-theme-text hover:text-theme-secondary transition duration-200 disabled:bg-grey-600';
const BUTTON_STYLE_ACTIVE = ' text-white bg-green-600 border-green-600';

/**
 * Applies highlighting of an activated service based on SimVars
 * This ensures the displayed state is in sync with the active services
 */
export const applySelectedWithSync = (className: string, id: string, gameSync: number, disabledId?: string) => {
    const activeButtons = (store.getState() as RootState).buttons.activeButtons;
    const disabledButtons = (store.getState() as RootState).buttons.disabledButtons;

    const index = activeButtons.map((b: StatefulButton) => b.id).indexOf(id);
    const disabledIndex = disabledButtons.indexOf(disabledId ?? '');

    if (gameSync > 0.5 && (index !== -1 || disabledIndex !== -1)) {
        return `${className} ${BUTTON_STYLE_ACTIVE}`;
    }
    return className + (activeButtons.map((b: StatefulButton) => b.id).includes(id) ? ' text-white bg-gray-600'
        : BUTTON_STYLE_INACTIVE);
};

export const applySelected = (className: string, id?: string) => {
    const activeButtons = (store.getState() as RootState).buttons.activeButtons;

    if (id) {
        return className + (activeButtons.map((b: StatefulButton) => b.id).includes(id) ? BUTTON_STYLE_ACTIVE
            : BUTTON_STYLE_INACTIVE);
    }
    return className;
};

export const Ground = () => {
    const { t } = useTranslation();

    const tabs: PageLink[] = [
        { name: 'Services', alias: t('Ground.Services.Title'), component: <ServicesPage /> },
        { name: 'Pushback', alias: t('Ground.Pushback.Title'), component: <PushbackPage /> },
        { name: 'Fuel', alias: t('Ground.Fuel.Title'), component: <FuelPage /> },
    ];

    return (
        <div className="w-full">
            <div className="relative mb-4">
                <h1 className="font-bold">{t('Ground.Title')}</h1>
                <Navbar
                    className="absolute top-0 right-0"
                    tabs={tabs}
                    basePath="/ground"
                />
            </div>
            <PageRedirect basePath="/ground" tabs={tabs} />
            <TabRoutes basePath="/ground" tabs={tabs} />
        </div>
    );
};
