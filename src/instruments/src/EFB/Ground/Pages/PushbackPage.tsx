/* eslint-disable max-len */
import React, { useEffect, useRef, useState } from 'react';
import { useSimVar, useSplitSimVar } from '@instruments/common/simVars';
import { ArrowLeft, ArrowRight, PauseCircleFill, PlayCircleFill, TruckFlatbed } from 'react-bootstrap-icons';
import Slider from 'rc-slider';
import { toast } from 'react-toastify';
import { MathUtils } from '@shared/MathUtils';
import { t } from '../../translation';

export const PushbackPage = () => {
    const [rudderPosition] = useSimVar('A:RUDDER POSITION', 'number', 50);
    const [elevatorPosition] = useSimVar('A:ELEVATOR POSITION', 'number', 50);
    const [aircraftGroundSpeed] = useSimVar('GROUND VELOCITY', 'Knots');
    const [aircraftHeading] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 50);
    const [pushBackAttached] = useSimVar('Pushback Attached', 'bool', 250);
    const [pushBackWait, setPushbackWait] = useSimVar('Pushback Wait', 'bool', 100);
    const [pushBackState, setPushBackState] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 250);
    const [pushbackAngle] = useSimVar('PUSHBACK ANGLE', 'Radians', 100);

    const [parkingBrakeEngaged, setParkingBrakeEngaged] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool', 250);

    const [pushBackPaused, setPushBackPaused] = useState(false);
    const [lastTime, setLastTime] = useState(0);
    const [deltaTime, setDeltaTime] = useState(0);
    const [tugCommandedHeading, setTugCommandedHeading] = useState(0);
    const [tugCommandedHeadingFactor, setTugCommandedHeadingFactor] = useState(0);
    const [tugCommandedSpeedFactor, setTugCommandedSpeedFactor] = useState(0);
    const [tugCommandedSpeed, setTugCommandedSpeed] = useState(0);

    // required so these can be used inside the setInterval callback function
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

    // called once when loading and unloading
    useEffect(() => {
        setPushBackPaused(true);
        setTugCommandedSpeedFactor(0);
        setPushbackWait(1);
        // when unloading the page
        return (() => {
            if (pushBackAttached) {
                toast.info('Pausing Pushback. Return to Pushback page to resume pushback.');
                setPushBackPaused(true);
                setTugCommandedSpeedFactor(0);
                setPushbackWait(1);
            }
        });
    }, []);

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

    const SHOW_DEBUG_INFO = false;
    const InternalTugHeadingDegrees = 0xffffffff / 360;

    const updater = () => {
        const startTime = Date.now();
        setDeltaTime(() => (startTime - lastTimeRef.current.valueOf()));
        setLastTime(() => startTime);

        const simOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'bool');
        const pushBackAttached = SimVar.GetSimVarValue('Pushback Attached', 'bool');

        if (pushBackAttached && simOnGround) {
            // If no speed is commanded stop the aircraft and return.
            if (pushbackPausedRef.current.valueOf() || tugCommandedSpeedFactorRef.current.valueOf() === 0) {
                SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', 0);
                SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', 0);
                SimVar.SetSimVarValue('Pushback Wait', 'bool', true);
            } else {
                // compute heading and speed
                SimVar.SetSimVarValue('Pushback Wait', 'bool', false);
                const parkingBrakeEngaged = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
                const aircraftHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');
                const computedTugHeading = (aircraftHeading - (50 * tugCommandedHeadingFactorRef.current.valueOf())) % 360;
                setTugCommandedHeading((() => computedTugHeading)); // debug
                const computedRotationVelocity = (tugCommandedSpeedFactorRef.current.valueOf() <= 0 ? -1 : 1) * tugCommandedHeadingFactorRef.current.valueOf() * (parkingBrakeEngaged ? 0.008 : 0.08);
                const convertedComputedHeading = (computedTugHeading * InternalTugHeadingDegrees) & 0xffffffff;
                const tugCommandedSpeed = tugCommandedSpeedFactorRef.current.valueOf() * (parkingBrakeEngaged ? 0.8 : 8);
                setTugCommandedSpeed(() => tugCommandedSpeed); // debug
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
        }

        if (SHOW_DEBUG_INFO) {
            const updateTime = Date.now() - startTime;
            console.log(`Pushback update took: ${updateTime}ms - Delta: ${deltaTimeRef.current}ms`);
        }
    };

    // Set up an update interval to ensure smooth movement independent of
    // Glass Cockpit refresh rate. This is required as refresh rate  is
    // 10x lower in external view which leads to jerky movements otherwise.
    const [updateInterval, setUpdateInterval] = useState(0);
    useEffect(() => {
        if (pushBackAttached && updateInterval === 0) {
            const interval = setInterval(updater, 50);
            // @ts-ignore
            setUpdateInterval(interval);
        } else if (!pushBackAttached) {
            clearInterval(updateInterval);
            setUpdateInterval(0);
        }
    }, [pushBackAttached]);

    const [showDebugInfo, setShowDebugInfo] = useState(false);

    function debugInformation() {
        return (
            <div className="flex absolute right-0 left-0 z-50 flex-grow justify-between mx-4 font-mono text-black bg-gray-100 border-gray-100">
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
                    °)
                </div>
                <div className="overflow-hidden text-black text-m">
                    acHeading:
                    {' '}
                    {aircraftHeading.toFixed(3)}
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
                    {aircraftGroundSpeed.toFixed(3)}
                    {'kts '}
                    {' ('}
                    {(aircraftGroundSpeed * 1.68781).toFixed(3)}
                    ft/s)
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
    }

    return (
        <div className="flex relative flex-col space-y-4 h-content-section-reduced">
            <div className="flex-grow rounded-lg border-2 border-theme-accent">
                {/* TODO: Insert bing map here */}
            </div>
            {showDebugInfo && debugInformation()}
            <div className="flex flex-col p-6 space-y-4 rounded-lg border-2 border-theme-accent">
                <div className="flex flex-row space-x-4">
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.CallTug')}</p>
                        <button
                            type="button"
                            onClick={() => handleCallTug()}
                            className={`${pushBackAttached ? 'text-white bg-green-600 border-green-600' : 'bg-theme-highlight opacity-60 hover:opacity-100 text-theme-text hover:text-theme-secondary transition duration-200 disabled:bg-grey-600'}  border-2 border-theme-accent w-full h-20 rounded-md transition duration-100 flex items-center justify-center`}
                        >
                            <TruckFlatbed size={40} />
                        </button>
                    </div>
                    <div className="w-full">
                        <p className="text-center">
                            {pushBackPaused ? t('Pushback.Halt') : t('Pushback.Moving')}
                        </p>
                        <button
                            type="button"
                            onClick={() => handlePause()}
                            className={`flex justify-center items-center w-full h-20 text-white bg-green-900 hover:bg-green-600 rounded-md transition duration-100 ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                        >
                            {pushBackPaused ? (
                                <PlayCircleFill size={40} />
                            ) : (
                                <PauseCircleFill size={40} />
                            )}
                        </button>
                    </div>
                    <div className="w-full" />
                    <div className="w-full">
                        <p className="text-center">{t('Pushback.ParkingBrake.Title')}</p>
                        <button
                            type="button"
                            onClick={() => setParkingBrakeEngaged((old) => !old)}
                            className={`w-full h-20 rounded-md transition duration-100 flex items-center justify-center  ${parkingBrakeEngaged ? 'bg-white text-utility-red' : 'bg-utility-red text-white'}`}
                        >
                            <h1 className="font-bold text-current uppercase">{parkingBrakeEngaged ? t('Pushback.ParkingBrake.On') : t('Pushback.ParkingBrake.Off')}</h1>
                        </button>
                    </div>
                </div>

                <div>
                    <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                        {t('Pushback.TugDirection')}
                    </p>
                    <div className="flex flex-row items-center space-x-4">
                        <p className="font-bold text-unselected">L</p>
                        <Slider
                            className={`${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                            onChange={(value) => handleTugDirection(value)}
                            min={-1}
                            step={0.01}
                            max={1}
                            value={tugCommandedHeadingFactor}
                            startPoint={0}
                        />
                        <p
                            className="font-bold text-unselected"
                            onDoubleClick={() => setShowDebugInfo(!showDebugInfo)}
                        >
                            R
                        </p>
                    </div>
                </div>

                <div className="flex flex-row space-x-4">
                    <div className="w-full">
                        <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                            { t('Pushback.Backward') }
                        </p>
                        <button
                            type="button"
                            className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                            onClick={() => handleTugSpeed(tugCommandedSpeedFactor - 0.1)}
                        >
                            <ArrowLeft size={40} />
                        </button>
                    </div>
                    <div className="w-full">
                        <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                            {t('Pushback.Forward')}
                        </p>
                        <button
                            type="button"
                            className={`flex justify-center items-center w-full h-20 bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100 hover:text-theme-highlight ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                            onClick={() => handleTugSpeed(tugCommandedSpeedFactor + 0.1)}
                        >
                            <ArrowRight size={40} />
                        </button>
                    </div>
                </div>
                <div>
                    <p className={`text-center ${!pushBackAttached && 'opacity-30 pointer-events-none'}`}>
                        {t('Pushback.TugSpeed')}
                    </p>
                    <Slider
                        className={`${!pushBackAttached && 'opacity-30 pointer-events-none'}`}
                        min={-1}
                        step={0.1}
                        max={1}
                        value={tugCommandedSpeedFactor}
                        onChange={(value) => handleTugSpeed(value)}
                        startPoint={0}
                    />
                </div>
            </div>
        </div>
    );
};
