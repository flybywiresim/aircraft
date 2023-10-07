import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, TruckFlatbed } from 'react-bootstrap-icons';
import { ServiceButtonWrapper } from '../Services/A320_251N/A320Services';
import { fetchGsxMenu, GsxMenuPrepChoices, GsxMenuStates } from '../../Ground';
import { t } from '../../../translation';
import { GroundServiceOutline } from '../../../Assets/GroundServiceOutline';

interface PushbackServiceProps {
    name: string,
    state: boolean,
    onClick: () => void,
    className?: string,
}

enum PushbackDirections {
    LEFT,
    RIGHT,
    STRAIGHT
}

enum PushbackCompletionState {
    CONFIRM,
    STOP
}

const PushbackServiceButton: React.FC<PushbackServiceProps> = ({ name, state, onClick, className, children }) => {
    if (!state) {
        return (<></>);
    }

    return (
        <div
            className={`flex flex-row items-center space-x-6 py-6 px-6 cursor-pointer ${className}`}
            onClick={onClick}
        >
            {children}
            <h1 className="flex-shrink-0 text-2xl font-medium text-current">{name}</h1>
        </div>
    );
};

interface GsxPushbackProps {
    selectGsxMenuChoice: (choice: number) => void,
    gsxState: GsxMenuStates,
    setGsxState: Dispatch<SetStateAction<GsxMenuStates>>,
    gsxExternalToggle: any
}
export const GsxPushbackPage: React.FC<GsxPushbackProps> = ({ gsxExternalToggle, selectGsxMenuChoice, gsxState, setGsxState }) => {
    const [pushbackAttached, setPushbackAttached] = useState(false);

    const serviceIndicationCss = 'text-2xl font-bold text-utility-amber w-min';

    // useEffect(() => {
    //     console.log('GSX: Pushback Page External toggle triggered');
    //     if (gsxExternalToggle !== 0) {
    //         if (gsxState === GsxMenuStates.PUSHBACK) {
    //             fetchGsxMenu().then((lines) => {
    //                 if (lines[0] !== 'Interrupt pushback?') {
    //                     console.log('GSX: Menu is at base menu, setting to interrupt pushback menu');
    //                     selectGsxMenuChoice(GsxMenuPrepChoices.PUSH_BACK);
    //                 }
    //             });
    //             setGsxState(GsxMenuStates.ENGINE_START);
    //         }
    //     }
    // }, [gsxExternalToggle]);

    // Because GSX does not toggle the event, we need to periodically check the menu
    useEffect(() => {
        console.log(`GSX: State has been changed to ${gsxState}`);
        if (gsxState !== GsxMenuStates.PUSHBACK_REQ) return;
        const interval = setInterval(() => {
            console.log('GSX: Checking if menu updated with pushback direction options');
            fetchGsxMenu().then((lines) => {
                if (lines[0] === 'Select pushback direction') {
                    console.log('GSX: menu updated with pushback directions');
                    setGsxState(GsxMenuStates.PUSHBACK_DIR);
                    setPushbackAttached(true);
                }
            });
        }, 5000);
        // eslint-disable-next-line consistent-return
        return () => clearInterval(interval);
    }, [gsxState]);

    const selectPushbackDirection = (direction: PushbackDirections) => {
        switch (direction) {
        case PushbackDirections.LEFT:
            selectGsxMenuChoice(0);
            break;
        case PushbackDirections.RIGHT:
            selectGsxMenuChoice(1);
            break;
        case PushbackDirections.STRAIGHT:
            selectGsxMenuChoice(3);
            break;
        default:
            console.error('GSX: Incorrect Pushback Direction given');
            break;
        }
        setGsxState(GsxMenuStates.PUSHBACK);
    };

    // TODO why is this not causing a re-render?
    const requestPushback = () => {
        console.log(`GSX: Setting GSX State to ${GsxMenuStates.PUSHBACK_REQ}`);
        setGsxState(GsxMenuStates.PUSHBACK_REQ);
        // console.log('GSX: Requesting Pushback');
        // selectGsxMenuChoice(GsxMenuPrepChoices.PUSH_BACK);
    };

    const selectPushbackCompletion = (state: PushbackCompletionState) => {
        switch (state) {
        case PushbackCompletionState.CONFIRM:
            selectGsxMenuChoice(0);
            break;
        case PushbackCompletionState.STOP:
            selectGsxMenuChoice(1);
            break;
        default:
            console.error('GSX: Incorrect pushback completion state given');
            break;
        }
        setGsxState(GsxMenuStates.PUSHBACK_DONE);
    };

    return (
        <div className="relative h-content-section-reduced">
            <GroundServiceOutline
                cabinLeftStatus={false}
                cabinRightStatus={false}
                aftLeftStatus={false}
                aftRightStatus={false}
                className="inset-x-0 mx-auto w-full h-full text-theme-text"
            />

            <ServiceButtonWrapper xr={930} y={24}>
                <PushbackServiceButton
                    name={t('Pushback.Gsx.RequestPushback')}
                    state={gsxState === GsxMenuStates.PREP}
                    onClick={() => requestPushback()}
                >
                    <TruckFlatbed size={50} />
                </PushbackServiceButton>
            </ServiceButtonWrapper>

            <ServiceButtonWrapper xr={900} y={24} className="">
                <PushbackServiceButton
                    name={t('Pushback.Gsx.NoseRight')}
                    state={gsxState === GsxMenuStates.PUSHBACK_DIR}
                    onClick={() => selectPushbackDirection(PushbackDirections.RIGHT)}
                >
                    <ChevronRight size={50} />
                </PushbackServiceButton>

                <PushbackServiceButton
                    name={t('Pushback.Gsx.Straight')}
                    state={gsxState === GsxMenuStates.PUSHBACK_DIR}
                    onClick={() => selectPushbackDirection(PushbackDirections.STRAIGHT)}
                >
                    <ChevronDown size={50} />
                </PushbackServiceButton>

                <PushbackServiceButton
                    name={t('Pushback.Gsx.NoseLeft')}
                    state={gsxState === GsxMenuStates.PUSHBACK_DIR}
                    onClick={() => selectPushbackDirection(PushbackDirections.RIGHT)}
                >
                    <ChevronLeft size={50} />
                </PushbackServiceButton>
            </ServiceButtonWrapper>

            <ServiceButtonWrapper xr={930} y={600} className="">
                <PushbackServiceButton
                    name={t('Pushback.Gsx.ConfirmEngineStart')}
                    state={gsxState === GsxMenuStates.ENGINE_START}
                    onClick={() => selectPushbackCompletion(PushbackCompletionState.STOP)}
                >
                    <Check size={50} />
                </PushbackServiceButton>

                <PushbackServiceButton
                    name={t('Pushback.Gsx.StopPushback')}
                    state={gsxState === GsxMenuStates.ENGINE_START}
                    onClick={() => selectPushbackCompletion(PushbackCompletionState.STOP)}
                >
                    <Check size={50} />
                </PushbackServiceButton>
            </ServiceButtonWrapper>

            {pushbackAttached && (
                <div
                    className={serviceIndicationCss}
                    style={{ position: 'absolute', left: 540, right: 0, top: 0 }}
                >
                    TUG
                </div>
            )}
        </div>
    );
};
