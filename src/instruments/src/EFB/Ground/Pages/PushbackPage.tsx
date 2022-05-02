/* eslint-disable max-len,no-console */
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
    PlayCircleFill,
    TruckFlatbed,
    ZoomIn,
    ZoomOut,
} from 'react-bootstrap-icons';
import Slider from 'rc-slider';
import { MathUtils } from '@shared/MathUtils';
import { IconPlane } from '@tabler/icons';
import { Coordinates } from 'msfs-geo';
import { computeDestinationPoint } from 'geolib'; // getDistance
import { toast } from 'react-toastify';
import { BingMap } from '../../UtilComponents/BingMap';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';

interface ScreenCoordinates {
    x: number;
    y: number;
}

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
    const [pushBackState, setPushBackState] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 250);
    const [pushBackWait, setPushbackWait] = useSimVar('Pushback Wait', 'bool', 100);
    const [pushBackAttached] = useSimVar('Pushback Attached', 'bool', 100);
    const [pushbackAngle] = useSimVar('PUSHBACK ANGLE', 'Radians', 100);

    const [rudderPosition] = useSimVar('A:RUDDER POSITION', 'number', 50);
    const [elevatorPosition] = useSimVar('A:ELEVATOR POSITION', 'number', 50);

    const [planeGroundSpeed] = useSimVar('GROUND VELOCITY', 'Knots', 50);
    const [planeHeadingTrue] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 50);
    const [planeHeadingMagnetic] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees', 50);
    const [planeLatitude] = useSimVar('A:PLANE LATITUDE', 'degrees latitude', 50);
    const [planeLongitude] = useSimVar('A:PLANE LONGITUDE', 'degrees longitude', 50);

    const [parkingBrakeEngaged, setParkingBrakeEngaged] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool', 250);

    const [mapRange, setMapRange] = useState(0.2);
    const [mouseDown, setMouseDown] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [centerPlaneMode, setCenterPlaneMode] = useState(true);
    const [actualMapLatLon, setActualMapLatLon] = useState({ lat: 0, long: 0 } as Coordinates);
    const [aircraftIconPosition, setAircraftIconPosition] = useState({ x: 0, y: 0 } as ScreenCoordinates);
    const [dragStartCoords, setDragStartCoords] = useState({ x: 0, y: 0 } as ScreenCoordinates);
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 } as ScreenCoordinates);

    const [pushBackPaused, setPushBackPaused] = useState(true);
    const [lastTime, setLastTime] = useState(0);
    const [deltaTime, setDeltaTime] = useState(0);
    const [tugCommandedHeading, setTugCommandedHeading] = useState(0);
    const [tugCommandedHeadingFactor, setTugCommandedHeadingFactor] = useState(0);
    const [tugCommandedSpeedFactor, setTugCommandedSpeedFactor] = useState(0);
    const [tugCommandedSpeed, setTugCommandedSpeed] = useState(0);
    const [tugInertiaFactor, setTugInertiaFactor] = useState(0);

    const [updateInterval, setUpdateInterval] = useState(0);

    // Required so these can be used inside the setInterval callback function for the
    // pushback movement update
    const updateIntervalRef = useRef(updateInterval);
    updateIntervalRef.current = updateInterval;
    const pushBackAttachedRef = useRef(pushBackAttached);
    pushBackAttachedRef.current = pushBackAttached;
    const pushbackPausedRef = useRef(pushBackPaused);
    pushbackPausedRef.current = pushBackPaused;
    const lastTimeRef = useRef(lastTime);
    lastTimeRef.current = lastTime;
    const deltaTimeRef = useRef(deltaTime);
    deltaTimeRef.current = deltaTime;
    const tugCommandedHeadingFactorRef = useRef(tugCommandedHeadingFactor);
    tugCommandedHeadingFactorRef.current = tugCommandedHeadingFactor;
    const tugCommandedSpeedFactorRef = useRef(tugCommandedSpeedFactor);
    tugCommandedSpeedFactorRef.current = tugCommandedSpeedFactor;
    const tugInertiaFactorRef = useRef(tugInertiaFactor);
    tugInertiaFactorRef.current = tugInertiaFactor;

    const handleCallTug = () => {
        setPushBackState(!pushBackState);
        setPushbackWait(1);
    };

    const handlePause = () => {
        setPushBackPaused(!pushBackPaused);
    };

    const handleTugSpeed = (speed: number) => {
        setTugCommandedSpeedFactor(MathUtils.clamp(speed, -1, 1));
        if (speed) {
            setPushBackPaused(false);
        }
    };

    const handleTugDirection = (value: number) => {
        setTugCommandedHeadingFactor(MathUtils.clamp(value, -1, 1));
    };

    const handleZoomChange = (value: number) => {
        const newRange = mapRange + value;
        const factor = mapRange / newRange;
        setMapRange(MathUtils.clamp(newRange, 0.1, 1.5));
        // place the aircraft icon according to the zoom level
        setAircraftIconPosition({ x: aircraftIconPosition.x * factor, y: aircraftIconPosition.y * factor });
    };

    // Computes the offset from  geo coordinates (Lat, Lon) and a delta of screen coordinates into
    // a destination set of geo coordinates.
    const computeOffset: (latLon: Coordinates, d: ScreenCoordinates) => Coordinates = (
        latLon: Coordinates, d: ScreenCoordinates,
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

    const decelerateTug = (factor: number = 1) => {
        const r = 0.05;
        const bf = factor;
        setTugInertiaFactor(() => bf);
        if (bf <= 0) {
            SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', 0);
            SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', 0);
            SimVar.SetSimVarValue('Pushback Wait', 'bool', true);
            console.log('Full Stop!');
            return;
        }
        setTimeout(() => {
            decelerateTug(bf - r);
        }, 50);
    };

    const accelerateTug = (factor: number = 0) => {
        const r = 0.05;
        const bf = factor;
        setTugInertiaFactor(() => bf);
        if (bf === 0) {
            SimVar.SetSimVarValue('Pushback Wait', 'bool', false);
        }
        if (bf >= 1) {
            return;
        }
        setTimeout(() => {
            accelerateTug(bf + r);
        }, 50);
    };

    // Callback function for the setInterval to update the movement of the aircraft independent of
    // the refresh rate of the Glass Cockpit Refresh Rate in internal and external view.
    const movementUpdate = () => {
        const startTime = Date.now();
        setDeltaTime(() => (startTime - lastTimeRef.current.valueOf()));
        setLastTime(() => startTime);

        const simOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'bool');

        if (pushBackAttachedRef.current.valueOf() && simOnGround) {
            // compute heading and speed
            const parkingBrakeEngaged = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
            const aircraftHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');

            const computedTugHeading = (aircraftHeading - (50 * tugCommandedHeadingFactorRef.current.valueOf())) % 360;
            setTugCommandedHeading((() => computedTugHeading)); // debug
            // K:KEY_TUG_HEADING expects an unsigned integer scaling 360° to 0 to 2^32-1 (0xffffffff / 360)
            const convertedComputedHeading = (computedTugHeading * (0xffffffff / 360)) & 0xffffffff;
            const computedRotationVelocity = (tugCommandedSpeedFactorRef.current.valueOf() <= 0 ? -1 : 1) * tugCommandedHeadingFactorRef.current.valueOf() * (parkingBrakeEngaged ? 0.008 : 0.08);

            const tugCommandedSpeed = tugCommandedSpeedFactorRef.current.valueOf() * (parkingBrakeEngaged ? 0.8 : 8) * tugInertiaFactorRef.current.valueOf();
            setTugCommandedSpeed(() => tugCommandedSpeed); // debug

            if (tugCommandedSpeed === 0) {
                SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', 0);
                SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', 0);
                SimVar.SetSimVarValue('Pushback Wait', 'bool', true);
                return;
            }

            SimVar.SetSimVarValue('Pushback Wait', 'bool', false);
            // Set tug heading
            SimVar.SetSimVarValue('K:KEY_TUG_HEADING', 'Number', convertedComputedHeading);
            SimVar.SetSimVarValue('ROTATION VELOCITY BODY X', 'Number', 0);
            SimVar.SetSimVarValue('ROTATION VELOCITY BODY Y', 'Number', computedRotationVelocity);
            SimVar.SetSimVarValue('ROTATION VELOCITY BODY Z', 'Number', 0);
            // Set tug speed
            SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', tugCommandedSpeed);
            SimVar.SetSimVarValue('VELOCITY BODY X', 'Number', 0);
            SimVar.SetSimVarValue('VELOCITY BODY Y', 'Number', 0);
            SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', tugCommandedSpeed);
        }
    };

    // called once when loading and unloading the page
    useEffect(() => {
        // when loading the page
        setPushBackPaused(true);

        // when unloading the page
        // !obs: as with setInterval no access to current local variable values
        return (() => {
            if (pushBackAttachedRef.current.valueOf()) {
                toast.info(t('Pushback.LeavePageMessage'), {
                    autoClose: 750,
                    hideProgressBar: true,
                    closeButton: false,
                });
                decelerateTug();
                clearInterval(updateIntervalRef.current.valueOf());
                SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', 0);
                SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', 0);
                SimVar.SetSimVarValue('Pushback Wait', 'bool', true);
            }
        });
    }, []);

    // Update commanded heading from rudder input
    useEffect(() => {
        // create deadzone
        if (rudderPosition > -0.05 && rudderPosition < 0.05) {
            setTugCommandedHeadingFactor(0);
            return;
        }
        setTugCommandedHeadingFactor(rudderPosition);
    }, [rudderPosition]);

    // Update commanded speed from elevator input
    useEffect(() => {
        // create deadzone
        if (elevatorPosition > -0.05 && elevatorPosition < 0.05) {
            setTugCommandedSpeedFactor(0);
            return;
        }
        setPushBackPaused(false);
        setTugCommandedSpeedFactor(-elevatorPosition);
    }, [elevatorPosition]);

    // Stop aircraft when paused
    useEffect(() => {
        if (pushBackPaused) {
            console.log('Paused');
            decelerateTug();
        } else {
            console.log('Unpaused');
            accelerateTug();
        }
    }, [pushBackPaused]);

    // Set up an update interval to ensure smooth movement independent of
    // Glass Cockpit Refresh Rate. This is required as the refresh rate is
    // 10x lower in external view which leads to jerky movements otherwise.
    useEffect(() => {
        if (pushBackAttached && updateInterval === 0) {
            console.log('Attached - start update interval');
            const interval = setInterval(movementUpdate, 30);
            setUpdateInterval(Number(interval));
        } else if (!pushBackAttached) {
            console.log('Detached - stop update interval');
            clearInterval(updateInterval);
            setUpdateInterval(0);
        }
    }, [pushBackAttached]);

    // Update actual lat/lon when plane is moving
    useEffect(() => {
        if (centerPlaneMode) {
            setActualMapLatLon({ lat: planeLatitude, long: planeLongitude });
            setAircraftIconPosition({ x: 0, y: 0 });
        }
        // console.log(`Update Map: ${planeLatitude.toFixed(6)} ${planeLongitude.toFixed(6)}`);
    }, [centerPlaneMode, planeLatitude.toFixed(6), planeLongitude.toFixed(6)]);

    // Update actual lat/lon when dragging the map
    useEffect(() => {
        if (dragging) {
            setCenterPlaneMode(false);
            const delta = { x: mouseCoords.x - dragStartCoords.x, y: mouseCoords.y - dragStartCoords.y };
            const latLon: Coordinates = computeOffset(actualMapLatLon, delta);
            setActualMapLatLon(latLon);
            setAircraftIconPosition({ x: aircraftIconPosition.x + delta.x, y: aircraftIconPosition.y - delta.y });
            setDragStartCoords(mouseCoords);
        }
    }, [dragging, mouseDown, mouseCoords]);

    const mapRangeCompensationScalar = mapRange / 0.45;
    const turningRadius = calculateTurningRadius(13, Math.abs(tugCommandedHeadingFactor * 90)) / mapRangeCompensationScalar * (Math.abs(tugCommandedSpeedFactor) / 0.2);
    // Debug info for pushback movement - can be removed eventually
    const [showDebugInfo, setShowDebugInfo] = useState(false);
    const debugInformation = () => (
        <div className="flex absolute right-0 left-0 z-50 flex-grow justify-between mx-4 font-mono text-black bg-gray-100 border-gray-100 opacity-50">
            <div className="overflow-hidden text-black text-m">
                deltaTime:
                {' '}
                {deltaTime}
                <br />
                pushBackPaused:
                {' '}
                {pushBackPaused ? 1 : 0}
                <br />
                pushBackWait:
                {' '}
                {pushBackWait}
                <br />
                pushBackAttached:
                {' '}
                {pushBackAttached}
                <br />
                pushBackState:
                {' '}
                {pushBackState}
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
            </div>
        </div>
    );

    return (
        <div className="flex relative flex-col space-y-4 h-content-section-reduced">

            {/* Map Container */}
            <div
                className="overflow-hidden relative flex-grow rounded-lg border-2 h-[430px] border-theme-accent"
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

                {/* Position Information */}
                {/* <div className="flex overflow-hidden absolute top-2 left-2 z-30 flex-col rounded-md cursor-pointer"> */}
                {/*    Heading (True): */}
                {/*    {' '} */}
                {/*    {planeHeadingTrue} */}
                {/*    {' - '} */}
                {/*    Lat: */}
                {/*    {' '} */}
                {/*    {actualMapLatLon.lat} */}
                {/*    {' - '} */}
                {/*    Lon: */}
                {/*    {' '} */}
                {/*    {actualMapLatLon.long} */}
                {/* </div> */}

                {/* Aircraft and Turning Radius Indicator */}
                <div className="flex absolute inset-0 justify-center items-center">
                    <div className="absolute" style={{ transform: `rotate(-90deg) scaleX(${tugCommandedSpeedFactor >= 0 ? 1 : -1}) scaleY(${tugCommandedHeadingFactor >= 0 ? 1 : -1}) translateY(${turningRadius}px)` }}>
                        <TurningRadiusIndicator turningRadius={turningRadius} />
                    </div>
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
                            onClick={() => setCenterPlaneMode(!centerPlaneMode)}
                            className="p-2 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
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
                            className="p-2 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
                        >
                            <ZoomIn size={40} />
                        </button>
                    </TooltipWrapper>
                    <TooltipWrapper text={t('Pushback.TT.ZoomOut')}>
                        <button
                            type="button"
                            onClick={() => handleZoomChange(0.1)}
                            className="p-2 transition duration-100 cursor-pointer hover:text-theme-body bg-theme-secondary hover:bg-theme-highlight"
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
                    {/* Call Tug */}
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.CallTug')}</p>
                        <TooltipWrapper text={t('Pushback.TT.CallReleaseTug')}>
                            <button
                                type="button"
                                onClick={handleCallTug}
                                className={`${pushBackAttached ? 'text-white bg-green-600 border-green-600' : 'bg-theme-highlight opacity-60 hover:opacity-100 text-theme-text hover:text-theme-secondary transition duration-200 disabled:bg-grey-600'}  border-2 border-theme-accent w-full h-20 rounded-md transition duration-100 flex items-center justify-center`}
                            >
                                <TruckFlatbed size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Pause/Moving Button */}
                    <div className="w-full">
                        <p className="text-center">
                            {pushBackPaused ? t('Pushback.Halt') : t('Pushback.Moving')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.PausePushback')}>
                            <button
                                type="button"
                                onClick={handlePause}
                                className={`flex justify-center items-center w-full h-20 text-white bg-green-900 hover:bg-green-600 rounded-md transition duration-100 ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                            >
                                {pushBackPaused ? (
                                    <PlayCircleFill size={40} />
                                ) : (
                                    <PauseCircleFill size={40} />
                                )}
                            </button>
                        </TooltipWrapper>
                    </div>

                    <div className="w-full" />

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
                        <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                            { t('Pushback.Backward') }
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.DecreaseSpeed')}>
                            <button
                                type="button"
                                className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                                onClick={() => handleTugSpeed(tugCommandedSpeedFactor - 0.1)}
                                onDoubleClick={() => handleTugSpeed(0)}
                            >
                                <ArrowDown size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Forward Button */}
                    <div className="w-full">
                        <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                            {t('Pushback.Forward')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.IncreaseSpeed')}>
                            <button
                                type="button"
                                className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                                onClick={() => handleTugSpeed(tugCommandedSpeedFactor + 0.1)}
                                onDoubleClick={() => handleTugSpeed(0)}
                            >
                                <ArrowUp size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Left Button */}
                    <div className="w-full">
                        <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                            {t('Pushback.Left')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.Left')}>
                            <button
                                type="button"
                                className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                                onClick={() => handleTugDirection(tugCommandedHeadingFactor - 0.1)}
                                onDoubleClick={() => handleTugDirection(0)}
                            >
                                <ArrowLeft size={40} />
                            </button>
                        </TooltipWrapper>
                    </div>

                    {/* Right Button */}
                    <div className="w-full">
                        <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                            {t('Pushback.Right')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.Right')}>
                            <button
                                type="button"
                                className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
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
                    <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                        {t('Pushback.TugDirection')}
                    </p>
                    <TooltipWrapper text={t('Pushback.TT.SliderDirection')}>
                        <div className="flex flex-row items-center space-x-4">
                            <p className="font-bold text-unselected"><ChevronLeft /></p>
                            <Slider
                                className={`${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
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
                    <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                        {t('Pushback.TugSpeed')}
                    </p>
                    <TooltipWrapper text={t('Pushback.TT.SliderSpeed')}>
                        <div className="flex flex-row items-center space-x-4">
                            <p className="font-bold text-unselected"><ChevronDoubleDown /></p>
                            <Slider
                                className={`${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                                min={-1}
                                step={0.1}
                                max={1}
                                value={tugCommandedSpeedFactor}
                                onChange={(value) => handleTugSpeed(value)}
                                startPoint={0}
                            />
                            <p
                                className="font-bold text-unselected"
                                onDoubleClick={() => setShowDebugInfo((old) => !old)}
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
