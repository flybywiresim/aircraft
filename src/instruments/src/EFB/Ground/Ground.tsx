import React, { useEffect, useState } from 'react';

import { IconCornerDownLeft, IconCornerDownRight, IconArrowDown, IconHandStop, IconTruck, IconBriefcase, IconBuildingArch, IconArchive, IconPlug, IconTir } from '@tabler/icons';

import fuselage from '../Assets/320neo-outline-upright.svg';

import { useSimVar, useSplitSimVar } from '../../Common/simVars';

import { DoorToggle } from './DoorToggle';
import Button, { BUTTON_TYPE } from '../Components/Button/Button';

import { useAppDispatch, useAppSelector } from '../Store/store';
import {
    addActiveButton,
    removeActiveButton,
    setTugRequestOnly,
    setActiveButtons,
    addDisabledButton,
    removeDisabledButton,
    setPushbackWaitTimerHandle,
} from '../Store/features/buttons';

import './Ground.scss';

type StatefulButton = {
    id: string,
    state: string
}

export const Ground = () => {
    const dispatch = useAppDispatch();

    const activeButtons = useAppSelector((state) => state.buttons.activeButtons);
    const pushBackWaitTimerHandle = useAppSelector((state) => state.buttons.pushBackWaitTimerHandle);
    const tugRequestOnly = useAppSelector((state) => state.buttons.tugRequestOnly);
    const disabledButtons = useAppSelector((state) => state.buttons.disabledButtons);

    const [jetWayActive, setJetWayActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 'K:TOGGLE_JETWAY', 'bool', 1000);
    const [, setRampActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 'K:TOGGLE_RAMPTRUCK', 'bool', 1000);
    const [cargoActive, setCargoActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:5', 'Percent over 100', 'K:REQUEST_LUGGAGE', 'bool', 1000);
    const [cateringActive, setCateringActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:3', 'Percent over 100', 'K:REQUEST_CATERING', 'bool', 1000);

    const [fuelingActive, setFuelingActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:9', 'Percent over 100', 'K:REQUEST_FUEL_KEY', 'bool', 1000);
    const [tugHeading, setTugHeading] = useSplitSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 'K:KEY_TUG_HEADING', 'UINT32', 1000);
    const [pushBack, setPushBack] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 1000);
    const [powerActive, setPowerActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:8', 'Percent over 100', 'K:REQUEST_POWER_SUPPLY', 'bool', 1000);

    const [, setPushbackWait] = useSimVar('Pushback Wait', 'bool', 100);
    const [pushBackAttached] = useSimVar('Pushback Attached', 'bool', 1000);

    const [tugDirection, setTugDirection] = useState(0);
    const [tugActive, setTugActive] = useState(false);

    const buttonBlue = ' border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 text-blue-darkest disabled:bg-grey-600';
    const buttonActive = ' text-white bg-green-600 border-green-600';

    const STATE_WAITING = 'WAITING';
    const STATE_ACTIVE = 'ACTIVE';

    /**
     * allows a direction to be selected directly
     * rather than first backwards and after that the direction
     */
    useEffect(() => {
        if (pushBack === 0 && tugDirection !== 0) {
            computeAndSetTugHeading(tugDirection);
            setTugDirection(0);
        }
        if (activeButtons.find((button) => button.id === 'tug-request') && tugRequestOnly) {
            /* Timer needed, as we cannot check when the variable "Pushback Wait" is being set to false after calling the tug */
            if (pushBackWaitTimerHandle === -1) {
                // FIXME: should i really be using WINDOW . setInterval() ?
                const timer = window.setInterval(() => {
                    setPushbackWait(1);
                }, 100);
                dispatch(setPushbackWaitTimerHandle(timer));
            }
        } else if (pushBackWaitTimerHandle !== -1) {
            clearInterval(pushBackWaitTimerHandle);
            dispatch(setPushbackWaitTimerHandle(-1));
        }
    }, [pushBack, tugDirection, activeButtons, pushBackWaitTimerHandle, tugRequestOnly, pushBack, tugDirection]);

    const getTugHeading = (value: number): number => (tugHeading + value) % 360;

    const computeAndSetTugHeading = (direction: number) => {
        if (tugRequestOnly) {
            dispatch(setTugRequestOnly(false));
        }
        const tugHeading = getTugHeading(direction);
        // KEY_TUG_HEADING is an unsigned integer, so let's convert
        setPushbackWait(0);
        setTugHeading((tugHeading * 11930465) & 0xffffffff);
        setTugDirection(direction);
    };

    const togglePushback = (callOnly: boolean = false) => {
        setPushBack(!pushBack);
        setTugActive(!tugActive);
        dispatch(setTugRequestOnly(callOnly));
    };

    const handleClick = (callBack: () => void, event: React.MouseEvent, disabledButton?: string) => {
        if (!tugActive) {
            if (!activeButtons.map((b: StatefulButton) => b.id).includes(event.currentTarget.id)) {
                dispatch(addActiveButton({ id: event.currentTarget.id, state: STATE_WAITING }));
                if (disabledButton) {
                    dispatch(addDisabledButton(disabledButton));
                }
                callBack();
            } else {
                const index = activeButtons.map((b: StatefulButton) => b.id).indexOf(event.currentTarget.id);
                if (index > -1) {
                    dispatch(removeActiveButton(index));
                }
                if (disabledButton) {
                    const disabledIndex = disabledButtons.indexOf(disabledButton);
                    dispatch(removeDisabledButton(disabledIndex));
                }
                callBack();
            }
        }
    };

    /**
     * Pushback actions disable all other services
     * So all highlighting should be removed as well
     */
    const handlePushBackClick = (callBack: () => void, event: React.MouseEvent) => {
        const tugRequest = 'tug-request';
        if (activeButtons.map((b: StatefulButton) => b.id).includes(tugRequest)) {
            if (event.currentTarget.id === tugRequest) {
                dispatch(setActiveButtons([]));
                callBack();
            } else {
                dispatch(setActiveButtons([{ id: event.currentTarget.id, state: STATE_ACTIVE }, { id: tugRequest, state: STATE_WAITING }]));
                callBack();
            }
        } else if (event.currentTarget.id === tugRequest) {
            dispatch(setActiveButtons([{ id: event.currentTarget.id, state: STATE_ACTIVE }, { id: tugRequest, state: STATE_WAITING }]));
            disabledButtons.forEach((b, index) => {
                dispatch(removeDisabledButton(index));
            });
            callBack();
        }
    };

    const applySelected = (className: string, id?: string) => {
        if (id) {
            return className + (activeButtons.map((b: StatefulButton) => b.id).includes(id) ? buttonActive
                : buttonBlue);
        }
        return className;
    };

    /**
     * Applies highlighting of an activated service based on SimVars
     * This ensures the displayed state is in sync with the active services
     */
    const applySelectedWithSync = (className: string, id: string, gameSync, disabledId?: string) => {
        const index = activeButtons.map((b: StatefulButton) => b.id).indexOf(id);
        const disabledIndex = disabledButtons.indexOf(disabledId ?? '');

        if (gameSync > 0.5 && (index !== -1 || disabledIndex !== -1)) {
            const button: StatefulButton = activeButtons[index];
            if (button && button.state === STATE_WAITING) {
                button.state = STATE_ACTIVE;
                dispatch(setActiveButtons(activeButtons));
            }
            return `${className} ${buttonActive}`;
        }
        if (gameSync === 0 && index !== -1) {
            const button: StatefulButton = activeButtons[index];
            if (button.state === STATE_ACTIVE) {
                dispatch(removeActiveButton(index));
                dispatch(removeDisabledButton(disabledIndex));
            }
        }
        return className + (activeButtons.map((b: StatefulButton) => b.id).includes(id) ? ' text-white bg-gray-600'
            : buttonBlue);
    };

    return (
        <div className="flex relative flex-col flex-grow h-full">
            <div className="flex">
                <h1 className="text-white">Ground</h1>
            </div>
            <img className="w-full airplane" src={fuselage} alt="fuselage" />
            <div className="grid absolute top-16 left-72 grid-cols-2 control-grid">
                <div>
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Pax</h1>
                    <Button
                        onClick={(e) => handleClick(() => {
                            setJetWayActive(1);
                            setRampActive(1);
                        }, e, 'door-fwd-left')}
                        className={applySelectedWithSync('w-32 ', 'jetway', jetWayActive, 'door-fwd-left')}
                        type={BUTTON_TYPE.NONE}
                        id="jetway"
                    >
                        <IconBuildingArch size="2.825rem" stroke="1.5" />
                    </Button>
                </div>
                <div>
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Door Fwd</h1>
                    <DoorToggle
                        index={0}
                        tugActive={tugActive}
                        onClick={handleClick}
                        selectionCallback={applySelectedWithSync}
                        id="door-fwd-left"
                        disabled={disabledButtons.includes('door-fwd-left')}
                    />
                </div>
            </div>

            <div className="grid absolute top-48 left-72 grid-cols-1 control-grid">
                <div>
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Fuel</h1>
                    <Button
                        onClick={(e) => handleClick(() => setFuelingActive(1), e)}
                        className={applySelectedWithSync('w-32', 'fuel', fuelingActive)}
                        type={BUTTON_TYPE.NONE}
                        id="fuel"
                    >
                        <IconTruck size="2.825rem" stroke="1.5" />
                    </Button>
                </div>
            </div>

            <div className="grid absolute top-16 right-72 grid-cols-2 control-grid">
                <div>
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Baggage</h1>
                    <Button
                        onClick={(e) => handleClick(() => setCargoActive(1), e)}
                        className={applySelectedWithSync('w-32', 'baggage', cargoActive)}
                        type={BUTTON_TYPE.NONE}
                        id="baggage"
                    >
                        <IconBriefcase size="2.825rem" stroke="1.5" />
                    </Button>
                </div>
                <div>
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Ext. Power</h1>
                    <Button
                        onClick={(e) => handleClick(() => setPowerActive(1), e)}
                        className={applySelectedWithSync('w-32', 'power', powerActive)}
                        type={BUTTON_TYPE.NONE}
                        id="power"
                    >
                        <IconPlug size="2.825rem" stroke="1.5" />
                    </Button>
                </div>
            </div>
            <div className="grid absolute right-72 bottom-36 grid-cols-2 control-grid">
                <div>
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Door Aft</h1>
                    <DoorToggle
                        tugActive={tugActive}
                        index={3}
                        onClick={handleClick}
                        selectionCallback={applySelectedWithSync}
                        id="door-aft-right"
                        disabled={disabledButtons.includes('door-aft-right')}
                    />
                </div>
                <div>
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Catering</h1>
                    <Button
                        onClick={(e) => handleClick(() => setCateringActive(1), e, 'door-aft-right')}
                        className={applySelectedWithSync('w-32', 'catering', cateringActive, 'door-aft-right')}
                        type={BUTTON_TYPE.NONE}
                        id="catering"
                    >
                        <IconArchive size="2.825rem" stroke="1.5" />
                    </Button>
                </div>
            </div>

            <div className="grid absolute bottom-2 left-0 grid-cols-3 ml-4 control-grid">
                <div>
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Call Tug</h1>
                    <Button
                        id="tug-request"
                        onClick={(e) => handlePushBackClick(() => togglePushback(true), e)}
                        className={applySelectedWithSync('w-32', 'tug-request', pushBackAttached)}
                        type={BUTTON_TYPE.NONE}
                    >
                        <IconTir size="2.825rem" stroke="1.5" />
                    </Button>
                </div>

                <div className="stop">
                    <h1 className="pb-1 text-xl font-medium text-center text-white">Pushback</h1>
                    <Button
                        id="stop"
                        onClick={(e) => handlePushBackClick(() => {
                            computeAndSetTugHeading(0);
                            dispatch(setTugRequestOnly(true));
                        }, e)}
                        className={applySelected('w-32 stop bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 text-blue-darkest')}
                        type={BUTTON_TYPE.NONE}
                    >
                        <IconHandStop size="2.825rem" stroke="1.5" />
                    </Button>
                </div>
                <Button
                    id="down-left"
                    type={BUTTON_TYPE.NONE}
                    onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(90), e)}
                    className={applySelected('w-32 down-left', 'down-left')}
                >
                    <IconCornerDownLeft size="2.825rem" stroke="1.5" />
                </Button>
                <Button
                    id="down"
                    type={BUTTON_TYPE.NONE}
                    onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(0), e)}
                    className={applySelected('down w-32', 'down')}
                >
                    <IconArrowDown size="2.825rem" stroke="1.5" />
                </Button>
                <Button
                    id="down-right"
                    type={BUTTON_TYPE.NONE}
                    onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(270), e)}
                    className={applySelected('w-32 down-right', 'down-right')}
                >
                    <IconCornerDownRight size="2.825rem" stroke="1.5" />
                </Button>
            </div>
        </div>
    );
};
