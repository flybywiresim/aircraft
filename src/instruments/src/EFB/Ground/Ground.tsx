import React, { FC, useEffect, useState } from 'react';

import {
    DoorOpenFill,
    Truck,
    PersonPlusFill,
    PlugFill,
    HandbagFill,
    ArchiveFill,
    StopCircleFill,
    TruckFlatbed,
    ArrowReturnLeft,
    ArrowReturnRight,
    ArrowDown,
} from 'react-bootstrap-icons';

import useInterval from '@instruments/common/useInterval';
import fuselage from '../Assets/320neo-outline-upright.svg';

import { useSimVar, useSplitSimVar } from '../../Common/simVars';

import Button, { BUTTON_TYPE } from '../Components/Button/Button';

import { useAppDispatch, useAppSelector } from '../Store/store';
import {
    addActiveButton,
    removeActiveButton,
    setTugRequestOnly,
    setActiveButtons,
    addDisabledButton,
    removeDisabledButton,
    updateButton,
} from '../Store/features/buttons';

interface StatefulButton {
    id: string,
    state: string,
    callBack,
    value: number,
}

interface ServiceButtonWrapperProps {
    className?: string,
    x: number,
    y: number
}

const ServiceButtonWrapper: FC<ServiceButtonWrapperProps> = ({ children, className, x, y }) => (
    <div
        className={`flex flex-col rounded-xl border-2 border-theme-accent divide-y-2 divide-theme-accent overflow-hidden ${className}`}
        style={{ position: 'absolute', left: x, top: y }}
    >
        {children}
    </div>
);

interface GroundServiceButtonProps {
    className?: string,
    name: string,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void,
    disabled?: boolean,
    id: string,
}

const GroundServiceButton: FC<GroundServiceButtonProps> = ({ children, className, name, onClick, disabled, id }) => (
    <button
        type="button"
        id={id}
        className={`flex flex-row items-center space-x-6 py-6 px-6 cursor-pointer ${className}`}
        onClick={onClick}
        disabled={disabled}
    >
        {children}
        <h1 className="flex-shrink-0 text-2xl font-medium text-white">{name}</h1>
    </button>
);

export const Ground = () => {
    const dispatch = useAppDispatch();

    const activeButtons = useAppSelector((state) => state.buttons.activeButtons);
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
    const [rudderPosition] = useSimVar('A:RUDDER POSITION', 'number', 50);
    const [brakeLeverPos, setBrakeLeverPos] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool', 1000);

    const [pushBackWait, setPushbackWait] = useSimVar('Pushback Wait', 'bool', 100);
    const [pushBackAttached] = useSimVar('Pushback Attached', 'bool', 1000);

    const [tugDirection, setTugDirection] = useState(0);
    const [tugActive, setTugActive] = useState(false);

    const buttonBlue = ' hover:bg-blue-600 transition duration-200 disabled:bg-grey-600';
    const buttonActive = ' text-white bg-green-600 border-green-600';

    const STATE_WAITING = 'WAITING';
    const STATE_ACTIVE = 'ACTIVE';

    useInterval(() => {
        if (activeButtons.find((button) => button.id === 'tug-request') && tugRequestOnly) {
            /* Timer needed, as we cannot check when the variable "Pushback Wait" is being set to false after calling the tug */
            setPushbackWait(1);
        }
    }, 100);

    useEffect(() => {
        /**
        * allows a direction to be selected directly
        * rather than first backwards and after that the direction
        */
        if (pushBack === 0 && tugDirection !== 0) {
            computeAndSetTugHeading(tugDirection);
            setTugDirection(0);
        }
        if (pushBackWait === 0 && !tugRequestOnly) {
            if (rudderPosition >= -0.05 && rudderPosition <= 0.05) {
                computeAndSetTugHeading(0);
            } else {
                computeAndSetTugHeading(rudderPosition <= 0 ? Math.abs(rudderPosition) / 0.0111 : 180 + rudderPosition / 0.0111);
            }
        }
    }, [pushBack, tugDirection, rudderPosition, tugHeading]);

    useEffect(() => {
        for (const button of activeButtons) {
            if (button.value > 0.5) {
                dispatch(updateButton(button));
            }
        }
    }, [jetWayActive, cargoActive, cateringActive, fuelingActive, powerActive, pushBack]);

    const getTugHeading = (value: number): number => (tugHeading + value) % 360;

    const computeAndSetTugHeading = (direction: number) => {
        if (tugRequestOnly) {
            dispatch(setTugRequestOnly(false));
        }
        const tugHeading = getTugHeading(direction);
        console.log(tugHeading);
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

    const handleClick = (callBack: () => void, event: React.MouseEvent, gameSync?, disabledButton?: string) => {
        if (!tugActive) {
            if (!activeButtons.map((b: StatefulButton) => b.id).includes(event.currentTarget.id)) {
                dispatch(addActiveButton({ id: event.currentTarget.id, state: STATE_WAITING, callBack, value: gameSync }));
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
        if (event.currentTarget.id === tugRequest) {
            if (!activeButtons.map((b: StatefulButton) => b.id).includes(tugRequest)) {
                dispatch(setActiveButtons([{ id: tugRequest, state: STATE_WAITING, callBack, value: pushBackAttached }]));
                disabledButtons.forEach((b, index) => {
                    dispatch(removeDisabledButton(index));
                });
                callBack();
            } else {
                dispatch(setActiveButtons([]));
                disabledButtons.forEach((b, index) => {
                    dispatch(removeDisabledButton(index));
                });
                callBack();
            }
        } else if (!activeButtons.map((b: StatefulButton) => b.id).includes(event.currentTarget.id)) {
            dispatch(setActiveButtons([{ id: tugRequest, state: STATE_ACTIVE, callBack, value: pushBackAttached }, { id: event.currentTarget.id, state: STATE_ACTIVE, callBack, value: 1 }]));
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
    const applySelectedWithSync = (className: string, id: string, gameSync: number, disabledId?: string) => {
        const index = activeButtons.map((b: StatefulButton) => b.id).indexOf(id);
        const disabledIndex = disabledButtons.indexOf(disabledId ?? '');

        if (gameSync > 0.5 && (index !== -1 || disabledIndex !== -1)) {
            return `${className} ${buttonActive}`;
        }
        return className + (activeButtons.map((b: StatefulButton) => b.id).includes(id) ? ' text-white bg-gray-600'
            : buttonBlue);
    };

    return (
        <div className="flex relative flex-col flex-grow h-full">
            <h1 className="font-bold">Ground</h1>

            {/* TODO: Replace with JIT value */}
            <img className="inset-x-0 mx-auto h-full" style={{ width: '51rem' }} src={fuselage} alt="fuselage" />

            <ServiceButtonWrapper x={64} y={64} className="">
                <GroundServiceButton
                    name="Connect Jet Bridge"
                    onClick={(e) => handleClick(() => {
                        setJetWayActive(1);
                        setRampActive(1);
                    }, e, jetWayActive, 'door-fwd-left')}
                    className={applySelectedWithSync('', 'jetway', jetWayActive, 'door-fwd-left')}
                    id="jetway"
                >
                    <PersonPlusFill size={36} />
                </GroundServiceButton>
                <DoorToggle
                    name="Door Fwd"
                    index={0}
                    tugActive={tugActive}
                    onClick={handleClick}
                    selectionCallback={applySelectedWithSync}
                    id="door-fwd-left"
                    disabled={disabledButtons.includes('door-fwd-left')}
                />
                <GroundServiceButton
                    name="Call Fuel Truck"
                    onClick={(e) => handleClick(() => setFuelingActive(1), e)}
                    className={applySelectedWithSync('', 'fuel', fuelingActive)}
                    id="fuel"
                >
                    <Truck size={36} />
                </GroundServiceButton>
            </ServiceButtonWrapper>

            <ServiceButtonWrapper x={750} y={64} className="">
                <GroundServiceButton
                    name={`${powerActive ? 'Disconnect' : 'Connect'} External Power`}
                    onClick={(e) => handleClick(() => setPowerActive(1), e)}
                    className={applySelectedWithSync('', 'power', powerActive)}
                    id="power"
                >
                    <PlugFill size={36} />
                </GroundServiceButton>
                <GroundServiceButton
                    name="Call Baggage Truck"
                    onClick={(e) => handleClick(() => setCargoActive(1), e)}
                    className={applySelectedWithSync('', 'baggage', cargoActive)}
                    id="baggage"
                >
                    <HandbagFill size={36} />
                </GroundServiceButton>
            </ServiceButtonWrapper>

            <ServiceButtonWrapper x={750} y={600} className="">
                <DoorToggle
                    tugActive={tugActive}
                    name="Door Aft"
                    index={3}
                    onClick={handleClick}
                    selectionCallback={applySelectedWithSync}
                    id="door-aft-right"
                    disabled={disabledButtons.includes('door-aft-right')}
                />
                <GroundServiceButton
                    name="Call Catering Truck"
                    onClick={(e) => handleClick(() => setCateringActive(1), e, 'door-aft-right')}
                    className={applySelectedWithSync('', 'catering', cateringActive, 'door-aft-right')}
                    id="catering"
                >
                    <ArchiveFill size={36} />
                </GroundServiceButton>
            </ServiceButtonWrapper>

            <div className="flex absolute bottom-2 left-0 flex-col ml-4 space-y-4">
                <div className="flex flex-row space-x-4">
                    <div>
                        <h1 className="pb-1 text-xl font-medium text-center text-white">Call Tug</h1>
                        <Button
                            id="tug-request"
                            onClick={(e) => handlePushBackClick(() => togglePushback(true), e)}
                            className={applySelectedWithSync('w-32 h-20 bg-blue-500 hover:bg-blue-600 transition duration-200 border-none', 'tug-request', pushBackAttached)}
                            type={BUTTON_TYPE.NONE}
                        >
                            <TruckFlatbed size="2.825rem" />
                        </Button>
                    </div>
                    <div>
                        <h1 className="pb-1 text-xl font-medium text-center text-white">Pushback</h1>
                        <Button
                            id="stop"
                            onClick={(e) => handlePushBackClick(() => {
                                computeAndSetTugHeading(0);
                                dispatch(setTugRequestOnly(true));
                            }, e)}
                            className={applySelected('w-32 h-20 border-none bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600')}
                            type={BUTTON_TYPE.NONE}
                        >
                            <StopCircleFill size="2.825rem" />
                        </Button>
                    </div>
                    <div>
                        <h1 className="pb-1 text-xl font-medium text-center text-white">Parking Brake</h1>
                        <Button
                            id="parking-brake"
                            onClick={() => setBrakeLeverPos((old) => !old)}
                            className={applySelected(`w-32 h-20 border-none ${brakeLeverPos ? 'bg-white text-red-500' : 'bg-red-500 hover:bg-red-600 transition duration-200 text-white'}`)}
                            type={BUTTON_TYPE.NONE}
                        >
                            <h1 className="font-bold text-current">P</h1>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-row space-x-4">
                    <Button
                        id="down-left"
                        type={BUTTON_TYPE.NONE}
                        onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(90), e)}
                        className={applySelected('w-32 h-20 bg-blue-500 hover:bg-blue-600 transition duration-200 border-none', 'down-left')}
                    >
                        <ArrowReturnLeft size="2.825rem" />
                    </Button>
                    <Button
                        id="down"
                        type={BUTTON_TYPE.NONE}
                        onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(0), e)}
                        className={applySelected('w-32 h-20 bg-blue-500 hover:bg-blue-600 transition duration-200 border-none', 'down')}
                    >
                        <ArrowDown size="2.825rem" />
                    </Button>
                    <Button
                        id="down-right"
                        type={BUTTON_TYPE.NONE}
                        onClick={(e) => handlePushBackClick(() => computeAndSetTugHeading(270), e)}
                        className={applySelected('w-32 h-20 bg-blue-500 hover:bg-blue-600 transition duration-200 border-none', 'down-right')}
                    >
                        <ArrowReturnRight size="2.825rem" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

type DoorToggleProps = {
    index: number,
    onClick: (callback: () => void, e: React.MouseEvent) => void,
    selectionCallback: (className: string, id: string, doorState: any, disabledId: string) => string,
    id: string,
    tugActive: boolean,
    disabled?: boolean,
    name: string,
}

const DoorToggle = ({ index, onClick, selectionCallback, id, tugActive, disabled, name }: DoorToggleProps) => {
    const [doorState, setDoorState] = useSplitSimVar(
        `A:INTERACTIVE POINT OPEN:${index}`,
        'Percent over 100',
        'K:TOGGLE_AIRCRAFT_EXIT',
        'Enum',
        500,
    );
    const [previousDoorState, setPreviousDoorState] = useState(doorState);

    useEffect(() => {
        if (tugActive && previousDoorState) {
            setDoorState(index + 1);
            setPreviousDoorState(!previousDoorState);
        } else if (tugActive) {
            setPreviousDoorState(false);
        } else {
            setPreviousDoorState(doorState);
        }
    }, [tugActive, index, previousDoorState, setDoorState, doorState]);

    return (
        <GroundServiceButton
            name={name}
            onClick={(e) => onClick(() => {
                setDoorState(index + 1);
                setPreviousDoorState(true);
            }, e)}
            className={selectionCallback('', id, doorState, id)}
            disabled={disabled}
            id={id}
        >
            <DoorOpenFill size={36} />
        </GroundServiceButton>
    );
};
