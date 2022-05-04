/* eslint-disable max-len */
import React, { useEffect, useRef, useState } from 'react';
import { useSimVar, useSplitSimVar } from '@instruments/common/simVars';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ChevronDoubleDown,
    ChevronDoubleUp,
    ChevronLeft,
    ChevronRight,
    PauseCircleFill,
    PlayCircleFill, ToggleOff, ToggleOn,
    TruckFlatbed,
    ZoomIn,
    ZoomOut,
} from 'react-bootstrap-icons';
import Slider from 'rc-slider';
import { MathUtils } from '@shared/MathUtils';
import { IconPlane } from '@tabler/icons';
import { Coordinates } from 'msfs-geo';
import { computeDestinationPoint } from 'geolib';
import { toast } from 'react-toastify';
import { BingMap } from '../../UtilComponents/BingMap';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
    TScreenCoordinates,
    setPushbackPaused,
    setMapRange,
    setCenterPlaneMode,
    setActualMapLatLon,
    setAircraftIconPosition,
    setShowDebugInfo,
    setTugCommandedHeadingFactor,
    setTugCommandedSpeedFactor,
    setTugInertiaFactor,
} from '../../Store/features/pushback';
import { PromptModal, useModals } from '../../UtilComponents/Modals/Modals';

interface TurningRadiusIndicatorProps {
    turningRadius: number;
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians)),
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, arcSweep, 0, end.x, end.y,
    ].join(' ');
};

const TurningRadiusIndicator = ({ turningRadius }: TurningRadiusIndicatorProps) => (
    <svg width={turningRadius * 2} height={turningRadius * 2} viewBox={`0 0 ${turningRadius * 2} ${turningRadius * 2}`}>
        <path d={describeArc(turningRadius, turningRadius, turningRadius, 0, 45 + 45 * (19 / turningRadius))} fill="none" stroke="white" strokeWidth="2" />
    </svg>
);

export const PushbackPage = () => {
    const dispatch = useAppDispatch();
    const { showModal } = useModals();

    const [pushbackSystemEnabled, setPushbackSystemEnabled] = useSimVar('L:A32NX_PUSHBACK_SYSTEM_ENABLED', 'bool', 100);

    const [pushbackAttached] = useSimVar('Pushback Attached', 'bool', 100);
    const [pushbackState, setPushbackState] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 250);
    const [pushbackWait, setPushbackWait] = useSimVar('Pushback Wait', 'bool', 100);
    const [pushbackAngle] = useSimVar('PUSHBACK ANGLE', 'Radians', 100);

    const [rudderPosition] = useSimVar('A:RUDDER POSITION', 'number', 50);
    const [elevatorPosition] = useSimVar('A:ELEVATOR POSITION', 'number', 50);

    const [planeGroundSpeed] = useSimVar('GROUND VELOCITY', 'Knots', 50);
    const [planeHeadingTrue] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 50);
    const [planeHeadingMagnetic] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees', 50);
    const [planeLatitude] = useSimVar('A:PLANE LATITUDE', 'degrees latitude', 50);
    const [planeLongitude] = useSimVar('A:PLANE LONGITUDE', 'degrees longitude', 50);

    const [parkingBrakeEngaged, setParkingBrakeEngaged] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool', 250);

    // Reducer state for pushback
    const {
        pushbackPaused,
        updateDeltaTime,
        mapRange,
        centerPlaneMode,
        actualMapLatLon,
        aircraftIconPosition,
        showDebugInfo,
        tugCommandedHeadingFactor,
        tugCommandedHeading,
        tugCommandedSpeedFactor,
        tugCommandedSpeed,
        tugInertiaFactor,
    } = useAppSelector((state) => state.pushback.pushbackState);

    // Map
    const [mouseDown, setMouseDown] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [dragStartCoords, setDragStartCoords] = useState({ x: 0, y: 0 } as TScreenCoordinates);
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 } as TScreenCoordinates);

    // Required so these can be used inside the useEffect return callback
    const pushBackAttachedRef = useRef(pushbackAttached);
    pushBackAttachedRef.current = pushbackAttached;
    const pushbackPausedRef = useRef(pushbackPaused);
    pushbackPausedRef.current = pushbackPaused;

    const handleEnableSystem = () => {
        if (pushbackSystemEnabled) {
            if (pushbackState < 3) {
                setPushbackState(!pushbackState);
            }
            setPushbackSystemEnabled(0);
            return;
        }
        showModal(
            <PromptModal
                title={t('Pushback.EnableSystemMessageTitle')}
                bodyText={`${t('Pushback.EnableSystemMessageBody')}`}
                onConfirm={() => {
                    setPushbackSystemEnabled(1);
                }}
            />,
        );
    };

    const handleCallTug = () => {
        setPushbackState(!pushbackState);
        setPushbackWait(1);
    };

    const handlePause = () => {
        dispatch(setPushbackPaused(!pushbackPaused));
    };

    const handleTugSpeed = (speed: number) => {
        dispatch(setTugCommandedSpeedFactor(MathUtils.clamp(speed, -1, 1)));
        if (speed) {
            dispatch(setPushbackPaused(false));
        }
    };

    const handleTugDirection = (value: number) => {
        dispatch(setTugCommandedHeadingFactor(MathUtils.clamp(value, -1, 1)));
    };

    const handleZoomChange = (value: number) => {
        const newRange = mapRange + value;
        const factor = mapRange / newRange;
        dispatch(setMapRange(MathUtils.clamp(newRange, 0.1, 1.5)));
        // place the aircraft icon according to the zoom level
        dispatch(setAircraftIconPosition({ x: aircraftIconPosition.x * factor, y: aircraftIconPosition.y * factor }));
    };

    const handleCenterPlaneModeChange = () => {
        dispatch(setCenterPlaneMode(!centerPlaneMode));
    };

    const pushbackActive = () => pushbackSystemEnabled && pushbackAttached;

    // Computes the offset from  geo coordinates (Lat, Lon) and a delta of screen coordinates into
    // a destination set of geo coordinates.
    const computeOffset: (latLon: Coordinates, d: TScreenCoordinates) => Coordinates = (
        latLon: Coordinates, d: TScreenCoordinates,
    ) => {
        // This constant has been determined via testing - needs more "thought"
        const someConstant = 0.48596;
        const distance = Math.hypot(d.x, d.y) / (someConstant / mapRange);
        const bearing = Math.atan2(d.y, d.x) * (180 / Math.PI) - 90 + planeHeadingTrue;
        const point = computeDestinationPoint({ lat: latLon.lat, lon: latLon.long }, distance, bearing);
        return { lat: point.latitude, long: point.longitude };
    };

    // Calculates the size in pixels based on the real A320 length and the current zoom
    const a320IconSize = (mapRange) => {
        const pixelPerMeter = 4.8596; // at 0.1 range
        const a320LengthMeter = 37.57;
        return a320LengthMeter * pixelPerMeter * (0.1 / mapRange);
    };

    // Calculates turning radius for the Turning prediction arc
    const calculateTurningRadius = (wheelBase: number, turnAngle: number) => {
        const tanDeg = Math.tan(turnAngle * Math.PI / 180);
        return wheelBase / tanDeg;
    };

    // FIXME
    // const decelerateTug = (factor: number = 1) => {
    //     const r = 0.05;
    //     const bf = factor;
    //     dispatch(setTugInertiaFactor(bf));
    //     if (bf <= 0) {
    //         console.log('Decelerated!');
    //         return;
    //     }
    //     setTimeout(() => {
    //         decelerateTug(bf - r);
    //     }, 50);
    // };
    //
    // const accelerateTug = (factor: number = 0) => {
    //     const r = 0.05;
    //     const bf = factor;
    //     dispatch(setTugInertiaFactor(bf));
    //     if (bf >= 1) {
    //         console.log('Accelerated!');
    //         return;
    //     }
    //     setTimeout(() => {
    //         accelerateTug(bf + r);
    //     }, 50);
    // };

    // called once when loading and unloading the page
    useEffect(() => {
        // when loading the page
        dispatch(setPushbackPaused(true));

        // when unloading the page
        // !obs: as with setInterval no access to current local variable values
        return (() => {
            if (pushBackAttachedRef.current && !pushbackPausedRef.current) {
                toast.info(t('Pushback.LeavePageMessage'), {
                    autoClose: 750,
                    hideProgressBar: true,
                    closeButton: false,
                });
                dispatch(setPushbackPaused(true));
            }
        });
    }, []);

    // Update commanded heading from rudder input
    useEffect(() => {
        if (!pushbackActive()) {
            return;
        }
        // create deadzone
        if (rudderPosition > -0.05 && rudderPosition < 0.05) {
            dispatch(setTugCommandedHeadingFactor(0));
            return;
        }
        dispatch(setTugCommandedHeadingFactor(rudderPosition));
    }, [rudderPosition]);

    // Update commanded speed from elevator input
    useEffect(() => {
        if (!pushbackActive()) {
            return;
        }
        // create deadzone
        if (elevatorPosition > -0.05 && elevatorPosition < 0.05) {
            dispatch(setTugCommandedSpeedFactor(0));
            return;
        }
        dispatch(setPushbackPaused(false));
        dispatch(setTugCommandedSpeedFactor(-elevatorPosition));
    }, [elevatorPosition]);

    // Update actual lat/lon when plane is moving
    useEffect(() => {
        if (centerPlaneMode) {
            dispatch(setActualMapLatLon({ lat: planeLatitude, long: planeLongitude }));
            dispatch(setAircraftIconPosition({ x: 0, y: 0 }));
        }
        // console.log(`Update Map: ${planeLatitude.toFixed(6)} ${planeLongitude.toFixed(6)}`);
    }, [centerPlaneMode, planeLatitude.toFixed(6), planeLongitude.toFixed(6)]);

    // Update actual lat/lon when dragging the map
    useEffect(() => {
        if (dragging) {
            dispatch(setCenterPlaneMode(false));
            const delta = { x: mouseCoords.x - dragStartCoords.x, y: mouseCoords.y - dragStartCoords.y };
            const latLon: Coordinates = computeOffset(actualMapLatLon, delta);
            dispatch(setActualMapLatLon(latLon));
            dispatch(setAircraftIconPosition({ x: aircraftIconPosition.x + delta.x, y: aircraftIconPosition.y - delta.y }));
            setDragStartCoords(mouseCoords);
        }
    }, [dragging, mouseDown, mouseCoords]);

    const mapRangeCompensationScalar = mapRange / 0.45;
    const turningRadius = calculateTurningRadius(13, Math.abs(tugCommandedHeadingFactor * 90)) / mapRangeCompensationScalar * (Math.abs(tugCommandedSpeedFactor) / 0.2);

    //     const [pushbackAvailable] = useSimVar('PUSHBACK AVAILABLE', 'enum', 100);
    //     const [accelX] = useSimVar('ACCELERATION BODY X', 'feet per second squared', 100);
    //     const [accelY] = useSimVar('ACCELERATION BODY Y', 'feet per second squared', 100);
    //     const [accelZ] = useSimVar('ACCELERATION BODY Z', 'feet per second squared', 100);
    //     const [accelRX] = useSimVar('ROTATION ACCELERATION BODY X', 'radians per second squared', 100);
    //     const [accelRY] = useSimVar('ROTATION ACCELERATION BODY Y', 'radians per second squared', 100);
    //     const [accelRZ] = useSimVar('ROTATION ACCELERATION BODY Z', 'radians per second squared', 100);

    // Debug info for pushback movement - can be removed eventually
    const debugInformation = () => (
        <div className="flex absolute right-0 left-0 z-50 flex-grow justify-between mx-4 font-mono text-black bg-gray-100 border-gray-100 opacity-50">
            <div className="overflow-hidden text-black text-m">
                deltaTime:
                {' '}
                {updateDeltaTime}
                <br />
                pushbackPaused:
                {' '}
                {pushbackPaused ? 1 : 0}
                <br />
                pushBackWait:
                {' '}
                {pushbackWait}
                <br />
                pushBackAttached:
                {' '}
                {pushbackAttached}
                <br />
                pushBackState:
                {' '}
                {pushbackState}
                <br />
                pushbackAvailable:
                {' '}
                {SimVar.GetSimVarValue('PUSHBACK AVAILABLE', 'bool')}
                <br />
                tugAngle:
                {' '}
                {pushbackAngle.toFixed(3)}
                {' ('}
                {(pushbackAngle * (180 / Math.PI)).toFixed(3)}
                {' °)'}
                <br />
                Heading (True):
                {' '}
                {planeHeadingTrue.toFixed(4)}
                <br />
                Heading (Magnetic):
                {' '}
                {planeHeadingMagnetic.toFixed(4)}
            </div>
            <div className="overflow-hidden text-black text-m">
                acHeading:
                {' '}
                {planeHeadingTrue.toFixed(3)}
                <br />
                tCHeadingF:
                {' '}
                {tugCommandedHeadingFactor.toFixed(3)}
                <br />
                tCHeading :
                {' '}
                {tugCommandedHeading.toFixed(3)}
                <br />
                Rotation Velocity X:
                {' '}
                {SimVar.GetSimVarValue('ROTATION VELOCITY BODY Y', 'Number').toFixed(3)}
                <br />
                Rotation Velocity Y:
                {' '}
                {SimVar.GetSimVarValue('ROTATION VELOCITY BODY X', 'Number').toFixed(3)}
                <br />
                {' '}
                Rotation Velocity Z:
                {' '}
                {SimVar.GetSimVarValue('ROTATION VELOCITY BODY Z', 'Number').toFixed(3)}
                <br />
                {' '}
                Rot. Accel. X:
                {' '}
                {SimVar.GetSimVarValue('ROTATION ACCELERATION BODY X', 'radians per second squared').toFixed(3)}
                <br />
                {' '}
                Rot. Accel. Y:
                {' '}
                {SimVar.GetSimVarValue('ROTATION ACCELERATION BODY Y', 'radians per second squared').toFixed(3)}
                <br />
                {' '}
                Rot. Accel Z:
                {' '}
                {SimVar.GetSimVarValue('ROTATION ACCELERATION BODY Z', 'radians per second squared').toFixed(3)}
            </div>
            <div className="overflow-hidden text-black text-m">
                acGroundSpeed:
                {' '}
                {planeGroundSpeed.toFixed(3)}
                {'kts '}
                {' ('}
                {(planeGroundSpeed * 1.68781).toFixed(3)}
                ft/s)
                <br />
                tugInertiaFactor:
                {' '}
                {tugInertiaFactor.toFixed(2)}
                <br />
                tCSpeedFactor:
                {' '}
                {tugCommandedSpeedFactor.toFixed(3)}
                <br />
                tCSpeed:
                {' '}
                {tugCommandedSpeed.toFixed(3)}
                <br />
                Velocity X:
                {' '}
                {SimVar.GetSimVarValue('VELOCITY BODY Y', 'Number').toFixed(3)}
                <br />
                Velocity Y:
                {' '}
                {SimVar.GetSimVarValue('VELOCITY BODY X', 'Number').toFixed(3)}
                <br />
                Velocity Z:
                {' '}
                {SimVar.GetSimVarValue('VELOCITY BODY Z', 'Number').toFixed(3)}
                <br />
                {' '}
                Accel. X:
                {' '}
                {SimVar.GetSimVarValue('ACCELERATION BODY X', 'feet per second squared').toFixed(3)}
                <br />
                {' '}
                Accel. Y:
                {' '}
                {SimVar.GetSimVarValue('ACCELERATION BODY Y', 'feet per second squared').toFixed(3)}
                <br />
                {' '}
                Accel Z:
                {' '}
                {SimVar.GetSimVarValue('ACCELERATION BODY Z', 'feet per second squared').toFixed(3)}

            </div>
        </div>
    );

    return (
        <div className="flex relative flex-col space-y-4 h-content-section-reduced">

            {/* Map Container */}
            <div
                className="overflow-hidden relative flex-grow h-[430px] rounded-lg border-2 border-theme-accent"
                onMouseDown={(e) => {
                    setMouseDown(true);
                    setDragStartCoords({ x: e.pageX, y: e.pageY });
                }}
                onMouseMove={(e) => {
                    if (mouseDown) {
                        setMouseCoords({ x: e.pageX, y: e.pageY });
                    }
                    if (mouseDown && !dragging && (Math.abs(e.pageX - dragStartCoords.x) > 3 || Math.abs(e.pageY - dragStartCoords.y) > 3)) {
                        setDragging(true);
                    }
                }}
                onMouseUp={() => {
                    setMouseDown(false);
                    if (dragging) {
                        setDragging(false);
                    }
                }}
            >
                {/* Map */}
                {!process.env.VITE_BUILD && (
                    <BingMap
                        configFolder="/Pages/VCockpit/Instruments/MAP/"
                        centerLla={{ lat: actualMapLatLon.lat, long: actualMapLatLon.long }}
                        mapId="PUSHBACK_MAP"
                        range={mapRange}
                        rotation={-planeHeadingTrue}
                    />
                )}

                {/* Aircraft and Turning Radius Indicator */}
                <div className="flex absolute inset-0 justify-center items-center">
                    {!Number.isNaN(turningRadius) && Number.isFinite(turningRadius)
                        && (
                            <div
                                className="absolute"
                                style={{ transform: `rotate(-90deg) scaleX(${tugCommandedSpeedFactor >= 0 ? 1 : -1}) scaleY(${tugCommandedHeadingFactor >= 0 ? 1 : -1}) translateY(${turningRadius}px)` }}
                            >
                                <TurningRadiusIndicator turningRadius={turningRadius} />
                            </div>
                        )}
                    {/* prepared to move with map when dragging - work in progress */}
                    <IconPlane
                        className="text-theme-highlight"
                        style={{ transform: `rotate(-90deg) translateY(${aircraftIconPosition.x}px) translateX(${aircraftIconPosition.y}px)` }}
                        size={a320IconSize(mapRange)}
                        strokeLinejoin="miter"
                        stroke={1}
                    />
                </div>

                {/* Map Controls */}
                <div className="flex overflow-hidden absolute right-6 bottom-6 z-30 flex-col rounded-md cursor-pointer">
                    <TooltipWrapper text={t('Pushback.TT.CenterPlaneMode')}>
                        <button
                            type="button"
                            onClick={() => handleCenterPlaneModeChange()}
                            className="p-2 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight transition duration-100 cursor-pointer"
                        >
                            <IconPlane
                                className={`text-white transform -rotate-90 ${centerPlaneMode && 'fill-current'}`}
                                size={40}
                                strokeLinejoin="round"
                            />
                        </button>
                    </TooltipWrapper>
                    <TooltipWrapper text={t('Pushback.TT.ZoomIn')}>
                        <button
                            type="button"
                            onClick={() => handleZoomChange(-0.1)}
                            className="p-2 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight transition duration-100 cursor-pointer"
                        >
                            <ZoomIn size={40} />
                        </button>
                    </TooltipWrapper>
                    <TooltipWrapper text={t('Pushback.TT.ZoomOut')}>
                        <button
                            type="button"
                            onClick={() => handleZoomChange(0.1)}
                            className="p-2 hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight transition duration-100 cursor-pointer"
                        >
                            <ZoomOut size={40} />
                        </button>
                    </TooltipWrapper>
                </div>
            </div>

            {/* Pushback Debug Information */}
            {showDebugInfo && debugInformation()}

            {/* Manual Pushback Controls */}
            <div className="flex flex-col p-6 space-y-4 rounded-lg border-2 border-theme-accent">
                <div className="flex flex-row space-x-4">
                    {/* Pushback System enabled On/Off */}
                    {pushbackSystemEnabled ? (
                        <div className="w-full">
                            <p className="text-center">{t('Pushback.SystemEnabledOn')}</p>
                            <TooltipWrapper text={t('Pushback.TT.SystemEnabledOn')}>
                                <button
                                    type="button"
                                    onClick={handleEnableSystem}
                                    className="bg-green-600 opacity-60 hover:opacity-100 text-theme-text hover:text-theme-secondary transition duration-200'}  border-2 border-theme-accent w-full h-20 rounded-md transition duration-100 flex items-center justify-center"
                                >
                                    <ToggleOn size={50} />
                                </button>
                            </TooltipWrapper>
                        </div>
                    ) : (
                        <div className="w-full">
                            <p className="text-center">{t('Pushback.SystemEnabledOff')}</p>
                            <TooltipWrapper text={t('Pushback.TT.SystemEnabledOff')}>
                                <button
                                    type="button"
                                    onClick={handleEnableSystem}
                                    className="bg-red-600 opacity-60 hover:opacity-100 text-theme-text hover:text-theme-secondary transition duration-200'}  border-2 border-theme-accent w-full h-20 rounded-md transition duration-100 flex items-center justify-center"
                                >
                                    <ToggleOff size={50} />
                                </button>
                            </TooltipWrapper>
                        </div>
                    )}

                    {/* Call Tug */}
                    <div className="w-full">
                        <p className="text-center">{pushbackAttached ? t('Pushback.TugAttached') : t('Pushback.CallTug')}</p>
                        <TooltipWrapper text={t('Pushback.TT.CallReleaseTug')}>
                            <button
                                type="button"
                                onClick={handleCallTug}
                                className={`${pushbackAttached ? 'text-white bg-green-600 border-green-600' : 'bg-theme-highlight opacity-60 hover:opacity-100 text-theme-text hover:text-theme-secondary transition duration-200 disabled:bg-grey-600'}  border-2 border-theme-accent w-full h-20 rounded-md transition duration-100 flex items-center justify-center ${!pushbackSystemEnabled && 'opacity-30 pointer-events-none'}`}
                            >
                                <TruckFlatbed size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Pause/Moving Button */}
                    <div className="w-full">
                        <p className="text-center">
                            {pushbackPaused ? t('Pushback.Halt') : t('Pushback.Moving')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.PausePushback')}>
                            <button
                                type="button"
                                onClick={handlePause}
                                className={`flex justify-center items-center w-full h-20 text-white bg-green-900 hover:bg-green-600 rounded-md transition duration-100 ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}
                            >
                                {pushbackPaused ? (
                                    <PlayCircleFill size={40} />
                                ) : (
                                    <PauseCircleFill size={40} />
                                )}
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Parking Brake */}
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.ParkingBrake.Title')}</p>
                        <TooltipWrapper text={t('Pushback.TT.SetReleaseParkingBrake')}>
                            <button
                                type="button"
                                onClick={() => setParkingBrakeEngaged((old) => !old)}
                                className={`w-full h-20 rounded-md transition duration-100 flex items-center justify-center  ${parkingBrakeEngaged ? 'bg-white text-utility-red' : 'bg-utility-red text-white'}`}
                            >
                                <h1 className="font-bold text-current uppercase">{parkingBrakeEngaged ? t('Pushback.ParkingBrake.On') : t('Pushback.ParkingBrake.Off')}</h1>
                            </button>
                        </TooltipWrapper>
                    </div>
                </div>

                <div className="flex flex-row space-x-4">

                    {/* Backward Button */}
                    <div className="w-full">
                        <p className={`text-center ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}>
                            { t('Pushback.Backward') }
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.DecreaseSpeed')}>
                            <button
                                type="button"
                                className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}
                                onClick={() => handleTugSpeed(tugCommandedSpeedFactor - 0.1)}
                                onDoubleClick={() => handleTugSpeed(0)}
                            >
                                <ArrowDown size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Forward Button */}
                    <div className="w-full">
                        <p className={`text-center ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}>
                            {t('Pushback.Forward')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.IncreaseSpeed')}>
                            <button
                                type="button"
                                className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}
                                onClick={() => handleTugSpeed(tugCommandedSpeedFactor + 0.1)}
                                onDoubleClick={() => handleTugSpeed(0)}
                            >
                                <ArrowUp size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Left Button */}
                    <div className="w-full">
                        <p className={`text-center ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}>
                            {t('Pushback.Left')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.Left')}>
                            <button
                                type="button"
                                className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}
                                onClick={() => handleTugDirection(tugCommandedHeadingFactor - 0.1)}
                                onDoubleClick={() => handleTugDirection(0)}
                            >
                                <ArrowLeft size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Right Button */}
                    <div className="w-full">
                        <p className={`text-center ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}>
                            {t('Pushback.Right')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.Right')}>
                            <button
                                type="button"
                                className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}
                                onClick={() => handleTugDirection(tugCommandedHeadingFactor + 0.1)}
                                onDoubleClick={() => handleTugDirection(0)}
                            >
                                <ArrowRight size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>
                </div>

                {/* Direction Slider */}
                <div>
                    <p className={`text-center ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}>
                        {t('Pushback.TugDirection')}
                    </p>
                    <TooltipWrapper text={t('Pushback.TT.SliderDirection')}>
                        <div className="flex flex-row items-center space-x-4">
                            <p className="font-bold text-unselected"><ChevronLeft /></p>
                            <Slider
                                className={`${!pushbackActive() && 'opacity-30 pointer-events-none'}`}
                                onChange={(value) => handleTugDirection(value)}
                                min={-1}
                                step={0.01}
                                max={1}
                                value={tugCommandedHeadingFactor}
                                startPoint={0}
                            />
                            <p className="font-bold text-unselected"><ChevronRight /></p>
                        </div>
                    </TooltipWrapper>
                </div>

                {/* Speed Slider */}
                <div>
                    <p className={`text-center ${!pushbackActive() && 'opacity-30 pointer-events-none'}`}>
                        {t('Pushback.TugSpeed')}
                    </p>
                    <TooltipWrapper text={t('Pushback.TT.SliderSpeed')}>
                        <div className="flex flex-row items-center space-x-4">
                            <p className="font-bold text-unselected"><ChevronDoubleDown /></p>
                            <Slider
                                className={`${!pushbackActive() && 'opacity-30 pointer-events-none'}`}
                                min={-1}
                                step={0.1}
                                max={1}
                                value={tugCommandedSpeedFactor}
                                onChange={(value) => handleTugSpeed(value)}
                                startPoint={0}
                            />
                            <p
                                className="font-bold text-unselected"
                                onDoubleClick={() => dispatch(setShowDebugInfo(!showDebugInfo))}
                            >
                                <ChevronDoubleUp />
                            </p>
                        </div>
                    </TooltipWrapper>
                </div>
            </div>
        </div>
    );
};
