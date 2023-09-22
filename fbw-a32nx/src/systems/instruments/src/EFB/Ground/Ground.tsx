import React, { useEffect, useState } from 'react';
import { usePersistentNumberProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { t } from '../translation';
import { PageLink, PageRedirect, TabRoutes } from '../Utils/routing';
import { Navbar } from '../UtilComponents/Navbar';
import { ServicesPage } from './Pages/ServicesPage';
import { PushbackPage } from './Pages/Pushback/PushbackPage';
import { FuelPage } from './Pages/FuelPage';
import { Payload } from './Pages/Payload/Payload';
import { GsxPushbackPage } from './Pages/Pushback/GsxPushbackPage';

export interface StatefulButton {
    id: string,
    state: string,
    callBack,
    value: number,
}

export enum GsxMenuStates {
    PREP,
    PREFLIGHT_ADD_SERV,
    BOARDING
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
    // GSX states
    const [gsxPayloadSyncEnabled] = usePersistentNumberProperty('GSX_PAYLOAD_SYNC', 0);
    const [gsxRefuelSyncEnabled] = usePersistentNumberProperty('GSX_FUEL_SYNC', 0);
    const [gsxPushbackEnabled] = usePersistentNumberProperty('GSX_PUSHBACK', 0);
    const [gsxCouatlStarted] = useSimVar('L:FSDT_GSX_COUATL_STARTED', 'Number', 223);
    const [, setGsxMenuOpen] = useSimVar('L:FSDT_GSX_MENU_OPEN', 'Number', 223);
    const [, setGsxMenuChoice] = useSimVar('L:FSDT_GSX_MENU_CHOICE', 'Number', 223);
    const [gsxExternalToggle, setGsxExternalToggle] = useSimVar('K:EXTERNAL_SYSTEM_TOGGLE', '', 223);
    const [gsxMenuCurrentState, setGsxMenuCurrentState] = useState<Number>(GsxMenuStates.PREP);
    const [gsxCallback, setGsxCallback] = useState(() => () => {});
    const [isGsxCalledBack, setIsGsxCalledBack] = useState(true);
    const [checkIfOperatorActive, setCheckIfOperatorActive] = useState(false);

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

    const handleGsxOperatorWindow = () => {
        setCheckIfOperatorActive(false);
        console.log('GSX: checking if operator/caterer menu is active');
        console.log('GSX: Opening menu');
        setGsxMenuOpen(1);
        setTimeout(() => {
            fetch('../../../ingamepanels/fsdt_gsx_panel/menu')
                .then((response) => response.text())
                .then((text) => text.split(/\r?\n/))
                .then((lines) => {
                    if (lines[0] === 'Select handling operator' || lines[0] === 'Select catering operator') {
                        console.log('GSX: operator/caterer menu is active, selecting GSX choice');
                        setGsxMenuOpen(1);
                        setTimeout(() => {
                            console.log('GSX: setting menu choice to -1');
                            setGsxMenuChoice(-1);
                        }, 150);
                        return;
                    }
                    console.log('GSX: operator/caterer menu is not active, moving on');
                })
                .catch((e) => console.error(`Failed to open GSX Menu due to: ${e}`));
        }, 150);
    };

    useEffect(() => {
        if (gsxPayloadSyncEnabled === 1 || gsxRefuelSyncEnabled === 1) {
            if (gsxExternalToggle !== 0 && gsxCouatlStarted === 1) {
                if (!isGsxCalledBack) {
                    console.log('GSX: external toggle is true callback triggered');
                    setGsxMenuOpen(1);
                    setTimeout(() => {
                        gsxCallback();
                        setCheckIfOperatorActive(true);
                        setIsGsxCalledBack(true);
                        setGsxExternalToggle(0);
                    }, 150);

                    return;
                }

                if (checkIfOperatorActive) {
                    handleGsxOperatorWindow();
                    return;
                }

                console.log('GSX: external toggle is true, but callback not triggered');
            }
        }
    }, [gsxExternalToggle]);

    const tabs: PageLink[] = [
        {
            name: 'Services',
            alias: t('Ground.Services.Title'),
            component: <ServicesPage
                selectGsxMenuChoice={selectGsxMenuChoice}
                gsxRefuelSyncEnabled={gsxRefuelSyncEnabled === 1}
                gsxPayloadSyncEnabled={gsxPayloadSyncEnabled === 1}
            />,
        },
        { name: 'Fuel', alias: t('Ground.Fuel.Title'), component: <FuelPage /> },
        {
            name: 'Payload',
            alias: t('Ground.Payload.Title'),
            component: <Payload
                gsxPayloadSyncEnabled={gsxPayloadSyncEnabled === 1}
                gsxMenuCurrentState={gsxMenuCurrentState}
                selectGsxMenuChoice={selectGsxMenuChoice}
                setGsxMenuCurrentState={setGsxMenuCurrentState}
            />,
        },
        {
            name: 'Pushback',
            alias: t('Ground.Pushback.Title'),
            component:
                gsxPushbackEnabled === 1
                    ? <GsxPushbackPage selectGsxMenuChoice={selectGsxMenuChoice} />
                    : <PushbackPage />,
        },
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
