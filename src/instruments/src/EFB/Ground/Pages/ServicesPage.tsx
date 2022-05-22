import React, { useState, FC, useEffect } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    Truck,
    PersonPlusFill,
    PlugFill,
    HandbagFill,
    ArchiveFill, ConeStriped, VinylFill as Wheel, TriangleFill as Chock, DoorClosedFill,
} from 'react-bootstrap-icons';

import { t } from '../../translation';
import { UprightOutline } from '../../Assets/UprightOutline';

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

enum ServiceButtonState {
    HIDDEN,
    DISABLED,
    INACTIVE,
    TRIGGERED,
    ACTIVE,
}

interface GroundServiceButtonProps {
    id: string,
    name: string,
    state: ServiceButtonState,
    onClick: () => void,
    className?: string,
}

const classes = [
    // HIDDEN
    '',
    // DISABLED
    'opacity-40 pointer-events-none',
    // INACTIVE
    'hover:bg-theme-highlight text-theme-text hover:text-theme-secondary transition duration-200 disabled:bg-grey-600',
    // TRIGGERED
    'text-white bg-amber-600 border-amber-600',
    // ACTIVE
    'text-white bg-green-600 border-green-600',
];

const GroundServiceButton: React.FC<GroundServiceButtonProps> = ({ children, id, name, state, onClick, className }) => {
    if (state === ServiceButtonState.HIDDEN) {
        return (<></>);
    }

    return (
        <div
            id={id}
            className={`flex flex-row items-center space-x-6 py-6 px-6 cursor-pointer ${classes[state]} ${className}`}
            onClick={state === ServiceButtonState.DISABLED ? undefined : onClick}
        >
            {children}
            <h1 className="flex-shrink-0 text-2xl font-medium text-current">{name}</h1>
        </div>
    );
};

export const ServicesPage = () => {
    // Flight state
    const [simOnGround] = useSimVar('SIM ON GROUND', 'bool', 250);
    const [aircraftIsStationary] = useSimVar('L:A32NX_IS_STATIONARY', 'bool', 250);
    const [pushBackAttached] = useSimVar('Pushback Attached', 'enum', 1000);
    const [groundServicesAvailable, setGroundServicesAvailable] = useState(simOnGround && aircraftIsStationary && !pushBackAttached);

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
    const [wheelChocksVisible, setWheelChocksVisible] = useState(wheelChocksEnabled && isGroundEquipmentVisible);
    const [conesVisible, setConesVisible] = useState(conesEnabled && isGroundEquipmentVisible);

    useEffect(() => {
        setGroundServicesAvailable(simOnGround && aircraftIsStationary && !pushBackAttached);
    }, [simOnGround, aircraftIsStationary, pushBackAttached]);

    useEffect(() => {
        setWheelChocksVisible(wheelChocksEnabled && isGroundEquipmentVisible);
        setConesVisible(conesEnabled && isGroundEquipmentVisible);
    }, [isGroundEquipmentVisible, wheelChocksEnabled, conesEnabled]);

    const getInteractiveOpeningState = (value) => {
        if (value === 0) {
            return ServiceButtonState.INACTIVE;
        }
        if (value > 0 && value < 1) {
            return ServiceButtonState.TRIGGERED;
        }
        return ServiceButtonState.ACTIVE;
    };

    // JetBridge Button
    const [jetWayButtonState, setJetWayButtonState] = useState(ServiceButtonState.INACTIVE);
    useEffect(() => {
        if (!groundServicesAvailable) {
            setJetWayButtonState(ServiceButtonState.DISABLED);
            return;
        }
        if (jetWayButtonState < ServiceButtonState.TRIGGERED) {
            return;
        }
        setJetWayButtonState(getInteractiveOpeningState(cabinDoorOpen));
    }, [groundServicesAvailable, cabinDoorOpen]);

    // Cabin Door Button
    const [cabinDoorButtonState, setCabinDoorButtonState] = useState(cabinDoorOpen ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE);
    useEffect(() => {
        if (!groundServicesAvailable) {
            setCabinDoorButtonState(ServiceButtonState.DISABLED);
            return;
        }
        setCabinDoorButtonState(getInteractiveOpeningState(cabinDoorOpen));
    }, [groundServicesAvailable, cabinDoorOpen]);

    // Fuel Truck Button
    const [fuelTruckButtonState, setFuelTruckButtonState] = useState(fuelingActive ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE);
    useEffect(() => {
        if (!groundServicesAvailable) {
            setFuelTruckButtonState(ServiceButtonState.DISABLED);
            return;
        }
        setFuelTruckButtonState(getInteractiveOpeningState(fuelingActive));
    }, [groundServicesAvailable, fuelingActive]);

    // GPU Button
    const [gpuButtonState, setGpuButtonState] = useState(gpuActive ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE);
    useEffect(() => {
        if (!groundServicesAvailable) {
            setGpuButtonState(ServiceButtonState.DISABLED);
            return;
        }
        setGpuButtonState(getInteractiveOpeningState(gpuActive));
    }, [groundServicesAvailable, gpuActive]);

    // Cargo Door Button
    const [cargoDoorButtonState, setCargoDoorButtonState] = useState(cargoDoorOpen ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE);
    useEffect(() => {
        if (!groundServicesAvailable) {
            setCargoDoorButtonState(ServiceButtonState.DISABLED);
            return;
        }
        setCargoDoorButtonState(getInteractiveOpeningState(cargoDoorOpen));
    }, [groundServicesAvailable, cargoDoorOpen]);

    // Baggage Button
    const [baggageButtonState, setBaggageButtonState] = useState(ServiceButtonState.INACTIVE);
    useEffect(() => {
        if (!groundServicesAvailable) {
            setBaggageButtonState(ServiceButtonState.DISABLED);
            return;
        }
        if (baggageButtonState < ServiceButtonState.TRIGGERED) {
            return;
        }
        setBaggageButtonState(getInteractiveOpeningState(cargoDoorOpen));
    }, [groundServicesAvailable, cargoDoorOpen]);

    // Aft Door Button
    const [aftDoorButtonState, setAftDoorButtonState] = useState(aftDoorOpen ? ServiceButtonState.ACTIVE : ServiceButtonState.INACTIVE);
    useEffect(() => {
        if (!groundServicesAvailable) {
            setAftDoorButtonState(ServiceButtonState.DISABLED);
            return;
        }
        setAftDoorButtonState(getInteractiveOpeningState(aftDoorOpen));
    }, [groundServicesAvailable, aftDoorOpen]);

    // Catering Button
    const [cateringButtonState, setCateringButtonState] = useState(ServiceButtonState.INACTIVE);
    useEffect(() => {
        if (!groundServicesAvailable) {
            setCateringButtonState(ServiceButtonState.DISABLED);
            return;
        }
        if (cateringButtonState < ServiceButtonState.TRIGGERED) {
            return;
        }
        setCateringButtonState(getInteractiveOpeningState(aftDoorOpen));
    }, [groundServicesAvailable, aftDoorOpen]);

    // Pushback or movement start --> close doors
    useEffect(() => {
        if (pushBackAttached || !aircraftIsStationary) {
            if (cabinDoorOpen === 1) {
                SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 1);
            }
            if (aftDoorOpen === 1) {
                SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 4);
            }
            if (cargoDoorOpen === 1) {
                SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 6);
            }
        }
    }, [pushBackAttached, aircraftIsStationary]);

    return (
        <div className="relative h-content-section-reduced">
            <UprightOutline className="inset-x-0 mx-auto w-full h-full text-theme-text" />

            {pushBackAttached && (
                <div
                    className="text-2xl font-bold text-utility-amber"
                    style={{ position: 'absolute', left: 540, right: 0, top: 0 }}
                >
                    TUG
                </div>
            )}

            <ServiceButtonWrapper xr={880} y={64}>

                {/* JET BRIDGE */}
                <GroundServiceButton
                    id="jetway"
                    name={t('Ground.Services.JetBridge')}
                    state={jetWayButtonState}
                    onClick={() => {
                        setJetWayButtonState(ServiceButtonState.TRIGGERED);
                        SimVar.SetSimVarValue('K:TOGGLE_JETWAY', 'bool', false);
                        SimVar.SetSimVarValue('K:TOGGLE_RAMPTRUCK', 'bool', false);
                    }}
                >
                    <PersonPlusFill size={36} />
                </GroundServiceButton>

                {/* CABIN DOOR */}
                <GroundServiceButton
                    id="cabinDoor"
                    name={t('Ground.Services.DoorFwd')}
                    state={cabinDoorButtonState}
                    onClick={() => {
                        setCabinDoorButtonState(ServiceButtonState.TRIGGERED);
                        SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 1);
                        // closing the door also should retract the jet bridge if we used it before
                        if (jetWayButtonState > ServiceButtonState.INACTIVE) {
                            SimVar.SetSimVarValue('K:TOGGLE_JETWAY', 'bool', true);
                            SimVar.SetSimVarValue('K:TOGGLE_RAMPTRUCK', 'bool', true);
                        }
                    }}
                >
                    <DoorClosedFill size={36} />
                </GroundServiceButton>

                {/* FUEL TRUCK */}
                <GroundServiceButton
                    id="fuel"
                    name={t('Ground.Services.FuelTruck')}
                    state={fuelTruckButtonState}
                    onClick={() => {
                        setFuelTruckButtonState(ServiceButtonState.TRIGGERED);
                        SimVar.SetSimVarValue('K:REQUEST_FUEL_KEY', 'bool', true);
                    }}
                >
                    <Truck size={36} />
                </GroundServiceButton>

            </ServiceButtonWrapper>

            {/* GPU */}
            <ServiceButtonWrapper xl={850} y={64} className="">
                <GroundServiceButton
                    id="power"
                    name={t('Ground.Services.ExternalPower')}
                    state={gpuButtonState}
                    onClick={() => {
                        setGpuButtonState(ServiceButtonState.TRIGGERED);
                        SimVar.SetSimVarValue('K:REQUEST_POWER_SUPPLY', 'bool', true);
                    }}
                >
                    <PlugFill size={36} />
                </GroundServiceButton>

                {/* CARGO DOOR */}
                <GroundServiceButton
                    id="door-cargo"
                    name={t('Ground.Services.DoorCargo')}
                    state={cargoDoorButtonState}
                    onClick={() => {
                        setCargoDoorButtonState(ServiceButtonState.TRIGGERED);
                        SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 6);
                        // closing the door also should cancel the catering if we used it before
                        if (baggageButtonState > ServiceButtonState.INACTIVE) {
                            SimVar.SetSimVarValue('K:REQUEST_LUGGAGE', 'bool', true);
                        }
                    }}
                >
                    <DoorClosedFill size={36} />
                </GroundServiceButton>

                {/* BAGGAGE TRUCK */}
                <GroundServiceButton
                    id="baggage"
                    name={t('Ground.Services.BaggageTruck')}
                    state={baggageButtonState}
                    onClick={() => {
                        setBaggageButtonState(ServiceButtonState.TRIGGERED);
                        SimVar.SetSimVarValue('K:REQUEST_LUGGAGE', 'bool', true);
                    }}
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

                {/* AFT DOOR */}
                <GroundServiceButton
                    id="door-aft-right"
                    name={t('Ground.Services.DoorAft')}
                    state={aftDoorButtonState}
                    onClick={() => {
                        setAftDoorButtonState(ServiceButtonState.TRIGGERED);
                        SimVar.SetSimVarValue('K:TOGGLE_AIRCRAFT_EXIT', 'enum', 4);
                        // closing the door also should cancel the catering if we used it before
                        if (cateringButtonState > ServiceButtonState.INACTIVE) {
                            SimVar.SetSimVarValue('K:REQUEST_CATERING', 'bool', true);
                        }
                    }}
                >
                    <DoorClosedFill size={36} />
                </GroundServiceButton>

                {/* CATERING TRUCK */}
                <GroundServiceButton
                    id="catering"
                    name={t('Ground.Services.CateringTruck')}
                    state={cateringButtonState}
                    onClick={() => {
                        setCateringButtonState(ServiceButtonState.TRIGGERED);
                        SimVar.SetSimVarValue('K:REQUEST_CATERING', 'bool', true);
                    }}
                >
                    <ArchiveFill size={36} />
                </GroundServiceButton>

            </ServiceButtonWrapper>
        </div>
    );
};
