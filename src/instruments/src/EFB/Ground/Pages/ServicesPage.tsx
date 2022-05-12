import React, { useState, FC, useEffect } from 'react';
import { useSimVar, useSplitSimVar } from '@instruments/common/simVars';
import {
    DoorOpenFill,
    Truck,
    PersonPlusFill,
    PlugFill,
    HandbagFill,
    ArchiveFill, ConeStriped, VinylFill as Wheel, TriangleFill as Chock,
} from 'react-bootstrap-icons';

import { t } from '../../translation';
import { UprightOutline } from '../../Assets/UprightOutline';

import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
    addActiveButton,
    removeActiveButton,
    addDisabledButton,
    removeDisabledButton,
    updateButton,
} from '../../Store/features/buttons';
import { applySelectedWithSync, StatefulButton } from '../Ground';

interface ServiceButtonWrapperProps {
    className?: string,
    xl?: number,
    xr?: number,
    y: number
}

const ServiceButtonWrapper: FC<ServiceButtonWrapperProps> = ({ children, className, xl, xr, y }) => (
    <div
        className={`flex flex-col rounded-xl border-2 border-theme-accent divide-y-2 divide-theme-accent overflow-hidden ${className}`}
        style={{ position: 'absolute', left: xl, right: xr, top: y }}
    >
        {children}
    </div>
);

interface GroundServiceButtonProps {
    className?: string,
    name: string,
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void,
    disabled?: boolean,
    id: string,
}

const GroundServiceButton: FC<GroundServiceButtonProps> = ({ children, className, name, onClick, disabled, id }) => (
    <div
        id={id}
        className={`flex flex-row items-center space-x-6 py-6 px-6 cursor-pointer ${className}`}
        onClick={disabled ? undefined : onClick}
    >
        {children}
        <h1 className="flex-shrink-0 text-2xl font-medium text-current">{name}</h1>
    </div>
);

export const ServicesPage = () => {
    const dispatch = useAppDispatch();

    const activeButtons = useAppSelector((state) => state.buttons.activeButtons);
    const disabledButtons = useAppSelector((state) => state.buttons.disabledButtons);

    const [jetWayActive, setJetWayActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 'K:TOGGLE_JETWAY', 'bool', 1000);
    const [, setRampActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 'K:TOGGLE_RAMPTRUCK', 'bool', 1000);
    const [cargoActive, setCargoActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:5', 'Percent over 100', 'K:REQUEST_LUGGAGE', 'bool', 1000);
    const [cateringActive, setCateringActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:3', 'Percent over 100', 'K:REQUEST_CATERING', 'bool', 1000);

    const [fuelingActive, setFuelingActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:9', 'Percent over 100', 'K:REQUEST_FUEL_KEY', 'bool', 1000);
    const [pushBack] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 1000);
    const [powerActive, setPowerActive] = useSplitSimVar('A:INTERACTIVE POINT OPEN:8', 'Percent over 100', 'K:REQUEST_POWER_SUPPLY', 'bool', 1000);

    const [wheelChocksEnabled] = useSimVar('L:A32NX_MODEL_WHEELCHOCKS_ENABLED', 'bool', 500);
    const [conesEnabled] = useSimVar('L:A32NX_MODEL_CONES_ENABLED', 'bool', 500);
    const [isGroundEquipmentVisible] = useSimVar('L:A32NX_GND_EQP_IS_VISIBLE', 'bool', 500);

    const [wheelChocksVisible, setWheelChocksVisible] = useState(wheelChocksEnabled && isGroundEquipmentVisible);
    const [conesVisible, setConesVisible] = useState(conesEnabled && isGroundEquipmentVisible);

    const [tugActive] = useState(false);

    const STATE_WAITING = 'WAITING';

    useEffect(() => {
        setWheelChocksVisible(wheelChocksEnabled && isGroundEquipmentVisible);
        setConesVisible(conesEnabled && isGroundEquipmentVisible);
    }, [isGroundEquipmentVisible, wheelChocksEnabled, conesEnabled]);

    useEffect(() => {
        for (const button of activeButtons) {
            if (button.value > 0.5) {
                dispatch(updateButton(button));
            }
        }
    }, [jetWayActive, cargoActive, cateringActive, fuelingActive, powerActive, pushBack, wheelChocksEnabled, conesEnabled]);

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

    return (
        <div className="relative h-content-section-reduced">
            {/* TODO: Replace with JIT value */}
            <UprightOutline className="inset-x-0 mx-auto w-full h-full text-theme-text" />

            <ServiceButtonWrapper xr={880} y={64}>
                <GroundServiceButton
                    name={t('Ground.Services.JetBridge')}
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
                    name={t('Ground.Services.DoorFwd')}
                    index={0}
                    tugActive={tugActive}
                    onClick={handleClick}
                    selectionCallback={applySelectedWithSync}
                    id="door-fwd-left"
                    disabled={disabledButtons.includes('door-fwd-left')}
                />
                <GroundServiceButton
                    name={t('Ground.Services.FuelTruck')}
                    onClick={(e) => handleClick(() => setFuelingActive(1), e)}
                    className={applySelectedWithSync('', 'fuel', fuelingActive)}
                    id="fuel"
                >
                    <Truck size={36} />
                </GroundServiceButton>
            </ServiceButtonWrapper>

            <ServiceButtonWrapper xl={770} y={64} className="">
                <GroundServiceButton
                    name={t('Ground.Services.ExternalPower')}
                    onClick={(e) => handleClick(() => setPowerActive(1), e)}
                    className={applySelectedWithSync('', 'power', powerActive)}
                    id="power"
                >
                    <PlugFill size={36} />
                </GroundServiceButton>
                <GroundServiceButton
                    name={t('Ground.Services.BaggageTruck')}
                    onClick={(e) => handleClick(() => setCargoActive(1), e)}
                    className={applySelectedWithSync('', 'baggage', cargoActive)}
                    id="baggage"
                >
                    <HandbagFill size={36} />
                </GroundServiceButton>
            </ServiceButtonWrapper>

            {/* Wheel Chocks and Security Cones are only visual information. To reuse styling */}
            {/* the ServiceButtonWrapper has been re-used. */}
            <ServiceButtonWrapper xr={800} y={600} className="border-0 divide-y-0">
                {wheelChocksEnabled === 1 && (
                    <div className={`flex flex-row items-center space-x-6 py-6 px-6 cursor-pointer ${(wheelChocksVisible) ? 'text-green-500' : 'text-gray-500'}`}>
                        <div className={`flex justify-center items-end -ml-2 -mr-[2px] ${(wheelChocksVisible) ? 'text-green-500' : 'text-gray-500'}`}>
                            <Chock size="12" stroke="4" />
                            <Wheel size="36" stroke="5" className="-mx-0.5" />
                            <Chock size="12" stroke="4" />
                        </div>
                        <h1 className="flex-shrink-0 text-2xl font-medium text-current">
                            {t('Ground.Services.WheelChocks')}
                        </h1>
                    </div>
                )}

                {conesEnabled === 1 && (
                    <div className={`flex flex-row items-center space-x-6 py-6 px-6 cursor-pointer ${(conesVisible) ? 'text-green-500' : 'text-gray-500'}`}>
                        <ConeStriped size="38" stroke="1.5" className="mr-2" />
                        <h1 className="flex-shrink-0 text-2xl font-medium text-current">
                            {t('Ground.Services.Cones')}
                        </h1>
                    </div>
                )}
            </ServiceButtonWrapper>

            <ServiceButtonWrapper xl={770} y={600} className="">
                <DoorToggle
                    tugActive={tugActive}
                    name={t('Ground.Services.DoorAft')}
                    index={3}
                    onClick={handleClick}
                    selectionCallback={applySelectedWithSync}
                    id="door-aft-right"
                    disabled={disabledButtons.includes('door-aft-right')}
                />
                <GroundServiceButton
                    name={t('Ground.Services.CateringTruck')}
                    onClick={(e) => handleClick(() => setCateringActive(1), e, 'door-aft-right')}
                    className={applySelectedWithSync('', 'catering', cateringActive, 'door-aft-right')}
                    id="catering"
                >
                    <ArchiveFill size={36} />
                </GroundServiceButton>
            </ServiceButtonWrapper>
        </div>
    );
};

interface DoorToggleProps {
    index: number;
    onClick: (callback: () => void, e: React.MouseEvent) => void;
    selectionCallback: (className: string, id: string, doorState: any, disabledId: string) => string;
    id: string;
    tugActive: boolean;
    disabled?: boolean;
    name: string;
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
