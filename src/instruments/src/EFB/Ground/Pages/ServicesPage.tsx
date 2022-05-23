import React, { useState, FC, useEffect } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    Truck,
    PersonPlusFill,
    PlugFill,
    HandbagFill,
    ArchiveFill, ConeStriped, VinylFill as Wheel, TriangleFill as Chock, DoorClosedFill,
} from 'react-bootstrap-icons';
import { ActionCreatorWithOptionalPayload } from '@reduxjs/toolkit';
import { t } from '../../translation';
import { UprightOutline } from '../../Assets/UprightOutline';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
    setJetWayButtonState,
    setCabinDoorButtonState,
    setFuelTruckButtonState,
    setGpuButtonState,
    setCargoDoorButtonState,
    setBaggageButtonState,
    setAftDoorButtonState,
    setCateringButtonState,
} from '../../Store/features/groundServicePage';

interface ServiceButtonWrapperProps {
    className?: string,
    xl?: number,
    xr?: number,
    y: number
}

// Groups buttons and sets a border and divider line
const ServiceButtonWrapper: FC<ServiceButtonWrapperProps> = ({ children, className, xl, xr, y }) => (
    <div
        className={`flex flex-col rounded-xl border-2 border-theme-accent divide-y-2 divide-theme-accent overflow-hidden ${className}`}
        style={{ position: 'absolute', left: xl, right: xr, top: y }}
    >
        {children}
    </div>
);

enum ServiceButton {
    CabinDoor,
    JetBridge,
    FuelTruck,
    Gpu,
    CargoDoor,
    BaggageTruck,
    AftDoor,
    CateringTruck
}

enum ServiceButtonState {
    HIDDEN,
    DISABLED,
    INACTIVE,
    CALLED,
    ACTIVE,
    RELEASED,
}

interface GroundServiceButtonProps {
    name: string,
    state: ServiceButtonState,
    onClick: () => void,
    className?: string,
}

const buttonsStyles = [
    // HIDDEN
    '',
    // DISABLED
    'opacity-20 pointer-events-none',
    // INACTIVE
    'hover:bg-theme-highlight text-theme-text hover:text-theme-secondary transition duration-200 disabled:bg-grey-600',
    // CALLED
    'text-white bg-amber-600 border-amber-600 pointer-events-none',
    // ACTIVE
    'text-white bg-green-700 border-green-700 hover:bg-green-500 hover:text-theme-secondary',
    // RELEASED
    'text-white bg-amber-600 border-amber-600 pointer-events-none',
];

const GroundServiceButton: React.FC<GroundServiceButtonProps> = ({ children, name, state, onClick, className }) => {
    if (state === ServiceButtonState.HIDDEN) {
        return (<></>);
    }
    return (
        <div
            className={`flex flex-row items-center space-x-6 py-6 px-6 cursor-pointer ${buttonsStyles[state]} ${className}`}
            onClick={state === ServiceButtonState.DISABLED ? undefined : onClick}
        >
            {children}
            <h1 className="flex-shrink-0 text-2xl font-medium text-current">
                {name}
                {' '}
                {state}
            </h1>
        </div>
    );
};

export const ServicesPage = () => {
    const dispatch = useAppDispatch();

    // Flight state
    const [simOnGround] = useSimVar('SIM ON GROUND', 'bool', 250);
    const [aircraftIsStationary] = useSimVar('L:A32NX_IS_STATIONARY', 'bool', 250);
    const [pushBackAttached] = useSimVar('Pushback Attached', 'enum', 1000);
    const [groundServicesAvailable] = useState(simOnGround && aircraftIsStationary && !pushBackAttached);

    // Ground Services
    const [cabinDoorOpen] = useSimVar('A:INTERACTIVE POINT OPEN:0', 'Percent over 100', 1000);
    const [aftDoorOpen] = useSimVar('A:INTERACTIVE POINT OPEN:3', 'Percent over 100', 1000);
    const [cargoDoorOpen] = useSimVar('A:INTERACTIVE POINT OPEN:5', 'Percent over 100', 1000);
    const [gpuActive] = useSimVar('A:INTERACTIVE POINT OPEN:8', 'Percent over 100', 1000);
    const [fuelingActive] = useSimVar('A:INTERACTIVE POINT OPEN:9', 'Percent over 100', 1000);

    // Wheel Chocks and Cones
    const [isGroundEquipmentVisible] = useSimVar('L:A32NX_GND_EQP_IS_VISIBLE', 'bool', 500);
    const [wheelChocksEnabled] = useSimVar('L:A32NX_MODEL_WHEELCHOCKS_ENABLED', 'bool', 500);
    const [conesEnabled] = useSimVar('L:A32NX_MODEL_CONES_ENABLED', 'bool', 500);
    const [wheelChocksVisible] = useState(wheelChocksEnabled && isGroundEquipmentVisible);
    const [conesVisible] = useState(conesEnabled && isGroundEquipmentVisible);

    // Service events
    const toggleCabinDoor = () => SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 1);
    const toggleJetBridgeAndStairs = () => {
        SimVar.SetSimVarValue('K:TOGGLE_JETWAY', 'bool', false);
        SimVar.SetSimVarValue('K:TOGGLE_RAMPTRUCK', 'bool', false);
    };
    const toggleFuelTruck = () => SimVar.SetSimVarValue('K:REQUEST_FUEL_KEY', 'bool', true);
    const toggleGpu = () => SimVar.SetSimVarValue('K:REQUEST_POWER_SUPPLY', 'bool', true);
    const toggleCargoDoor = () => SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 6);
    const toggleBaggageTruck = () => SimVar.SetSimVarValue('K:REQUEST_LUGGAGE', 'bool', true);
    const toggleAftDoor = () => SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 4);
    const toggleCateringTruck = () => SimVar.SetSimVarValue('K:REQUEST_CATERING', 'bool', true);

    // Button states
    const cabinDoorButtonState = useAppSelector((state) => state.groundServicePage.cabinDoorButtonState);
    const jetWayButtonState = useAppSelector((state) => state.groundServicePage.jetWayButtonState);
    const fuelTruckButtonState = useAppSelector((state) => state.groundServicePage.fuelTruckButtonState);
    const gpuButtonState = useAppSelector((state) => state.groundServicePage.gpuButtonState);
    const cargoDoorButtonState = useAppSelector((state) => state.groundServicePage.cargoDoorButtonState);
    const baggageButtonState = useAppSelector((state) => state.groundServicePage.baggageButtonState);
    const aftDoorButtonState = useAppSelector((state) => state.groundServicePage.aftDoorButtonState);
    const cateringButtonState = useAppSelector((state) => state.groundServicePage.cateringButtonState);

    // Centralized handler for managing clicks to any button
    const handleButtonClick = (id: ServiceButton) => {
        switch (id) {
        case ServiceButton.CabinDoor:
            updateButtonState(cabinDoorButtonState, setCabinDoorButtonState);
            toggleCabinDoor();
            break;
        case ServiceButton.JetBridge:
            // Toggle called/released
            if (jetWayButtonState < ServiceButtonState.CALLED) {
                dispatch(setJetWayButtonState(ServiceButtonState.CALLED));
            } else {
                dispatch(setJetWayButtonState(ServiceButtonState.RELEASED));
            }
            // enable/disable cabin door button after a timeout
            if (cabinDoorButtonState === ServiceButtonState.DISABLED) {
                setTimeout(() => {
                    dispatch(setCabinDoorButtonState(ServiceButtonState.INACTIVE));
                }, 5000);
            } else {
                dispatch(setCabinDoorButtonState(ServiceButtonState.DISABLED));
            }
            // if door was already open use a timer to set to active
            if (jetWayButtonState <= ServiceButtonState.CALLED && cabinDoorOpen > 0.9) {
                setTimeout(() => {
                    dispatch(setJetWayButtonState(ServiceButtonState.ACTIVE));
                }, 5000);
            }
            toggleJetBridgeAndStairs();
            break;
        case ServiceButton.FuelTruck:
            // Toggle called/released
            if (fuelTruckButtonState < ServiceButtonState.CALLED) {
                dispatch(setFuelTruckButtonState(ServiceButtonState.CALLED));
            } else {
                dispatch(setFuelTruckButtonState(ServiceButtonState.RELEASED));
            }
            toggleFuelTruck();
            break;
        case ServiceButton.Gpu:
            // Toggle called/released
            if (gpuButtonState < ServiceButtonState.CALLED) {
                dispatch(setGpuButtonState(ServiceButtonState.CALLED));
            } else {
                dispatch(setGpuButtonState(ServiceButtonState.RELEASED));
            }
            toggleGpu();
            break;
        case ServiceButton.CargoDoor:
            updateButtonState(cargoDoorButtonState, setCargoDoorButtonState);
            toggleCargoDoor();
            break;
        case ServiceButton.BaggageTruck:
            // Toggle called/released
            if (baggageButtonState < ServiceButtonState.CALLED) {
                dispatch(setBaggageButtonState(ServiceButtonState.CALLED));
            } else {
                dispatch(setBaggageButtonState(ServiceButtonState.RELEASED));
            }
            // enable/disable cabin door button after a timeout
            if (cargoDoorButtonState === ServiceButtonState.DISABLED) {
                setTimeout(() => {
                    dispatch(setCargoDoorButtonState(ServiceButtonState.INACTIVE));
                }, 5000);
            } else {
                dispatch(setCargoDoorButtonState(ServiceButtonState.DISABLED));
            }
            // if door was already open use a timer to set to active
            if (baggageButtonState <= ServiceButtonState.CALLED && cargoDoorOpen > 0.9) {
                setTimeout(() => {
                    dispatch(setBaggageButtonState(ServiceButtonState.ACTIVE));
                }, 5000);
            }
            toggleBaggageTruck();
            break;
        case ServiceButton.AftDoor:
            updateButtonState(aftDoorButtonState, setAftDoorButtonState);
            toggleAftDoor();
            break;
        case ServiceButton.CateringTruck:
            // Toggle called/released
            if (cateringButtonState < ServiceButtonState.CALLED) {
                dispatch(setCateringButtonState(ServiceButtonState.CALLED));
            } else {
                dispatch(setCateringButtonState(ServiceButtonState.RELEASED));
            }
            // enable/disable cabin door button after a timeout
            if (aftDoorButtonState === ServiceButtonState.DISABLED) {
                setTimeout(() => {
                    dispatch(setAftDoorButtonState(ServiceButtonState.INACTIVE));
                }, 5000);
            } else {
                dispatch(setAftDoorButtonState(ServiceButtonState.DISABLED));
            }
            // if door was already open use a timer to set to active
            if (cateringButtonState <= ServiceButtonState.CALLED && aftDoorOpen > 0.9) {
                setTimeout(() => {
                    dispatch(setCateringButtonState(ServiceButtonState.ACTIVE));
                }, 5000);
            }
            toggleCateringTruck();
            break;
        default:
            break;
        }
    };

    // Changes the state of a button based on the current state
    const updateButtonState = (
        buttonState: ServiceButtonState,
        setter: ActionCreatorWithOptionalPayload<ServiceButtonState, string>,
    ) => {
        switch (buttonState) {
        case ServiceButtonState.INACTIVE:
            dispatch(setter(ServiceButtonState.CALLED));
            break;
        case ServiceButtonState.CALLED:
            dispatch(setter(ServiceButtonState.RELEASED));
            break;
        case ServiceButtonState.ACTIVE:
            dispatch(setter(ServiceButtonState.RELEASED));
            break;
        case ServiceButtonState.RELEASED:
            dispatch(setter(ServiceButtonState.CALLED));
            break;
        default:
            break;
        }
    };

    // Determines the state of a service based on a given door state input
    // All services are basically active and terminated based on a
    // door state (INTERACTION POINT OPEN)
    const setServiceState = (
        state: ServiceButtonState,
        setter: ActionCreatorWithOptionalPayload<ServiceButtonState, string>,
        doorState: number,
    ) => {
        switch (state) {
        case ServiceButtonState.HIDDEN:
        case ServiceButtonState.DISABLED:
        case ServiceButtonState.INACTIVE:
            break;
        case ServiceButtonState.CALLED:
            if (doorState >= 0.9) dispatch(setter(ServiceButtonState.ACTIVE));
            break;
        case ServiceButtonState.ACTIVE:
            if (doorState < 0.9 && doorState > 0.1) dispatch(setter(ServiceButtonState.RELEASED));
            if (doorState <= 0.1) dispatch(setter(ServiceButtonState.INACTIVE));
            break;
        case ServiceButtonState.RELEASED:
            if (doorState <= 0.1) dispatch(setter(ServiceButtonState.INACTIVE));
            break;
        default:
        }
    };

    // Door and simple door-like services
    useEffect(() => {
        setServiceState(cabinDoorButtonState, setCabinDoorButtonState, cabinDoorOpen);
        setServiceState(cargoDoorButtonState, setCargoDoorButtonState, cargoDoorOpen);
        setServiceState(aftDoorButtonState, setAftDoorButtonState, aftDoorOpen);
        setServiceState(fuelTruckButtonState, setFuelTruckButtonState, fuelingActive);
        setServiceState(gpuButtonState, setGpuButtonState, gpuActive);
    }, [cabinDoorOpen, cargoDoorOpen, aftDoorOpen, fuelingActive, gpuActive]);

    // JetBridge Button - linked to cabin door
    useEffect(() => {
        setServiceState(jetWayButtonState, setJetWayButtonState, cabinDoorOpen);
        // enable cabin door button in case door has been closed by other means (e.g. pushback)
        if (cabinDoorOpen < 1.0
            && jetWayButtonState >= ServiceButtonState.ACTIVE
            && cabinDoorButtonState === ServiceButtonState.DISABLED) {
            setTimeout(() => {
                dispatch(setCabinDoorButtonState(ServiceButtonState.INACTIVE));
            }, 5000);
        }
    }, [cabinDoorOpen]);

    // Baggage Button - linked to cargo door
    useEffect(() => {
        setServiceState(baggageButtonState, setBaggageButtonState, cargoDoorOpen);
        // enable cabin door button in case door has been closed by other means (e.g. pushback)
        if (cargoDoorOpen < 1.0
            && baggageButtonState >= ServiceButtonState.ACTIVE
            && cargoDoorButtonState === ServiceButtonState.DISABLED) {
            setTimeout(() => {
                dispatch(setCargoDoorButtonState(ServiceButtonState.INACTIVE));
            }, 5000);
        }
    }, [cargoDoorOpen]);

    // Catering Button - linked to aft right cabin door
    useEffect(() => {
        setServiceState(cateringButtonState, setCateringButtonState, aftDoorOpen);
        // enable cabin door button in case door has been closed by other means (e.g. pushback)
        if (aftDoorOpen < 1.0
            && cateringButtonState >= ServiceButtonState.ACTIVE
            && cateringButtonState === ServiceButtonState.DISABLED) {
            setTimeout(() => {
                dispatch(setCateringButtonState(ServiceButtonState.INACTIVE));
            }, 5000);
        }
    }, [aftDoorOpen]);

    // Pushback or movement start --> disable buttons and close doors
    // Enable buttons if all have been disabled before
    useEffect(() => {
        if (!groundServicesAvailable) {
            dispatch(setCabinDoorButtonState(ServiceButtonState.DISABLED));
            dispatch(setJetWayButtonState(ServiceButtonState.DISABLED));
            dispatch(setFuelTruckButtonState(ServiceButtonState.DISABLED));
            dispatch(setGpuButtonState(ServiceButtonState.DISABLED));
            dispatch(setCargoDoorButtonState(ServiceButtonState.DISABLED));
            dispatch(setBaggageButtonState(ServiceButtonState.DISABLED));
            dispatch(setAftDoorButtonState(ServiceButtonState.DISABLED));
            dispatch(setCateringButtonState(ServiceButtonState.DISABLED));
            if (cabinDoorOpen === 1) {
                SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 1);
            }
            if (aftDoorOpen === 1) {
                SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 4);
            }
            if (cargoDoorOpen === 1) {
                SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 6);
            }
        } else if (cateringButtonState === ServiceButtonState.DISABLED
            && jetWayButtonState === ServiceButtonState.DISABLED
            && fuelTruckButtonState === ServiceButtonState.DISABLED
            && gpuButtonState === ServiceButtonState.DISABLED
            && cargoDoorButtonState === ServiceButtonState.DISABLED
            && baggageButtonState === ServiceButtonState.DISABLED
            && aftDoorButtonState === ServiceButtonState.DISABLED
            && cateringButtonState === ServiceButtonState.DISABLED
        ) {
            dispatch(setCabinDoorButtonState(ServiceButtonState.INACTIVE));
            dispatch(setJetWayButtonState(ServiceButtonState.INACTIVE));
            dispatch(setFuelTruckButtonState(ServiceButtonState.INACTIVE));
            dispatch(setGpuButtonState(ServiceButtonState.INACTIVE));
            dispatch(setCargoDoorButtonState(ServiceButtonState.INACTIVE));
            dispatch(setBaggageButtonState(ServiceButtonState.INACTIVE));
            dispatch(setAftDoorButtonState(ServiceButtonState.INACTIVE));
            dispatch(setCateringButtonState(ServiceButtonState.INACTIVE));
        }
    }, [groundServicesAvailable]);

    return (
        <div className="relative h-content-section-reduced">
            <UprightOutline className="inset-x-0 mx-auto w-full h-full text-theme-text" />

            <ServiceButtonWrapper xr={880} y={64}>

                {/* CABIN DOOR */}
                <GroundServiceButton
                    name={t('Ground.Services.DoorFwd')}
                    state={cabinDoorButtonState}
                    onClick={() => handleButtonClick(ServiceButton.CabinDoor)}
                >
                    <DoorClosedFill size={36} />
                </GroundServiceButton>

                {/* JET BRIDGE */}
                <GroundServiceButton
                    name={t('Ground.Services.JetBridge')}
                    state={jetWayButtonState}
                    onClick={() => handleButtonClick(ServiceButton.JetBridge)}
                >
                    <PersonPlusFill size={36} />
                </GroundServiceButton>

                {/* FUEL TRUCK */}
                <GroundServiceButton
                    name={t('Ground.Services.FuelTruck')}
                    state={fuelTruckButtonState}
                    onClick={() => handleButtonClick(ServiceButton.FuelTruck)}
                >
                    <Truck size={36} />
                </GroundServiceButton>

            </ServiceButtonWrapper>

            {/* GPU */}
            <ServiceButtonWrapper xl={850} y={64} className="">
                <GroundServiceButton
                    name={t('Ground.Services.ExternalPower')}
                    state={gpuButtonState}
                    onClick={() => handleButtonClick(ServiceButton.Gpu)}
                >
                    <PlugFill size={36} />
                </GroundServiceButton>

                {/* CARGO DOOR */}
                <GroundServiceButton
                    name={t('Ground.Services.DoorCargo')}
                    state={cargoDoorButtonState}
                    onClick={() => handleButtonClick(ServiceButton.CargoDoor)}
                >
                    <DoorClosedFill size={36} />
                </GroundServiceButton>

                {/* BAGGAGE TRUCK */}
                <GroundServiceButton
                    name={t('Ground.Services.BaggageTruck')}
                    state={baggageButtonState}
                    onClick={() => handleButtonClick(ServiceButton.BaggageTruck)}
                >
                    <HandbagFill size={36} />
                </GroundServiceButton>

            </ServiceButtonWrapper>

            <ServiceButtonWrapper xl={850} y={600} className="">

                {/* AFT DOOR */}
                <GroundServiceButton
                    name={t('Ground.Services.DoorAft')}
                    state={aftDoorButtonState}
                    onClick={() => handleButtonClick(ServiceButton.AftDoor)}
                >
                    <DoorClosedFill size={36} />
                </GroundServiceButton>

                {/* CATERING TRUCK */}
                <GroundServiceButton
                    name={t('Ground.Services.CateringTruck')}
                    state={cateringButtonState}
                    onClick={() => handleButtonClick(ServiceButton.CateringTruck)}
                >
                    <ArchiveFill size={36} />
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

            {/* Visual indications for tug and doors */}
            {!!pushBackAttached && (
                <div
                    className="text-2xl font-bold text-utility-amber"
                    style={{ position: 'absolute', left: 540, right: 0, top: 0 }}
                >
                    TUG
                </div>
            )}
            {cabinDoorOpen > 0 && (
                <div
                    className="text-xl font-bold text-utility-amber"
                    style={{ position: 'absolute', left: 515, right: 0, top: 105 }}
                >
                    CABIN
                </div>
            )}
            {aftDoorOpen > 0 && (
                <div
                    className="text-xl font-bold text-utility-amber"
                    style={{ position: 'absolute', left: 705, right: 0, top: 665 }}
                >
                    CABIN
                </div>
            )}
            {cargoDoorOpen > 0 && (
                <div
                    className="text-xl font-bold text-utility-amber"
                    style={{ position: 'absolute', left: 705, right: 0, top: 200 }}
                >
                    CARGO
                </div>
            )}
            {gpuActive > 0 && (
                <div
                    className="text-xl font-bold text-utility-amber"
                    style={{ position: 'absolute', left: 705, right: 0, top: 70 }}
                >
                    GPU
                </div>
            )}
        </div>
    );
};
