import React, { useEffect, useState } from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk';
import { t } from '../translation';
import { PageLink, PageRedirect, TabRoutes } from '../Utils/routing';
import { Navbar } from '../UtilComponents/Navbar';
import { ServicesPage } from './Pages/ServicesPage';
import { PushbackPage } from './Pages/PushbackPage';
import { FuelPage } from './Pages/FuelPage';
import { Payload } from './Pages/Payload/Payload';

export interface StatefulButton {
    id: string,
    state: string,
    callBack,
    value: number,
}

export enum GsxMenuStates {
    PREP,
    PREFLIGHT_ADD_SERV,
    BOARDING,
    OPERATOR_SELECT
}

export enum GsxMenuPrepChoices {
    RQST_DEBOARD= 0,
    RQST_CTR= 1,
    RQST_REFUL= 2,
    RQST_BOARD= 3,
    PUSH_BACK= 4,
    NO_JET= 5,
    OP_STAIR= 6,
    ADD_SERV= 7,
}

export const Ground = () => {
    const [gsxCouatlStarted] = useSimVar('L:FSDT_GSX_COUATL_STARTED', 'Number', 223);
    const [, setGsxMenuOpen] = useSimVar('L:FSDT_GSX_MENU_OPEN', 'Number', 223);
    const [, setGsxMenuChoice] = useSimVar('L:FSDT_GSX_MENU_CHOICE', 'Number', 223);
    const [gsxExternalToggle, setGsxExternalToggle] = useSimVar('K:EXTERNAL_SYSTEM_TOGGLE', '', 223);
    const [gsxMenuCurrentState, setGsxMenuCurrentState] = useState<Number>(GsxMenuStates.PREP);
    const [gsxCallback, setGsxCallback] = useState(() => () => {});
    const [isGsxCalledBack, setIsGsxCalledBack] = useState(true);

    const selectGsxMenuChoice = (choice: number) => {
        console.log('GSX: Opening Menu');
        setGsxMenuOpen(1);

        setTimeout(() => {
            console.log(`GSX: Setting GSX callback to menu choice ${choice}`);

            setGsxCallback(() => () => {
                console.log(`GSX: setting menu choice to ${choice}`);
                setGsxMenuChoice(choice);
            });

            setIsGsxCalledBack(false);
            setGsxExternalToggle(0);
        }, 100);
    };

    const checkIfGsxOperatorActive = () => {
        console.log('GSX: checking if operator/caterer menu is active');
        if (gsxMenuCurrentState === GsxMenuStates.OPERATOR_SELECT) {
            console.log('GSX: operator/caterer menu is active, selecting GSX choice');
            setGsxMenuOpen(1);
            setTimeout(() => {
                console.log('GSX: setting menu choice to -1');
                setGsxMenuChoice(-1);
                console.log('GSX: changing menu state back to boarding');
                setGsxMenuCurrentState(GsxMenuStates.PREP);
            }, 500);
            return;
        }
        console.log('GSX: operator/caterer menu is not active, moving on');
    };

    useEffect(() => {
        if (gsxExternalToggle !== 0 && gsxCouatlStarted === 1) {
            if (!isGsxCalledBack) {
                console.log('GSX: external toggle is true callback triggered');
                gsxCallback();
                setIsGsxCalledBack(true);

                setTimeout(() => checkIfGsxOperatorActive(), 100);
                return;
            }
            console.log('GSX: external toggle is true, but callback not triggered');
            return;
        }
        console.log('GSX: external toggle is false');
        console.log(`GSX: toggle: ${gsxExternalToggle}`);
        console.log(`GSX: couatl ${gsxCouatlStarted}`);
    }, [gsxExternalToggle]);

    const tabs: PageLink[] = [
        { name: 'Services', alias: t('Ground.Services.Title'), component: <ServicesPage /> },
        { name: 'Fuel', alias: t('Ground.Fuel.Title'), component: <FuelPage /> },
        {
            name: 'Payload',
            alias: t('Ground.Payload.Title'),
            component: <Payload
                gsxMenuCurrentState={gsxMenuCurrentState}
                selectGsxMenuChoice={selectGsxMenuChoice}
                setGsxMenuCurrentState={setGsxMenuCurrentState}
            />,
        },
        { name: 'Pushback', alias: t('Ground.Pushback.Title'), component: <PushbackPage /> },
    ];

    return (
        <div className="transform-gpu">
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
