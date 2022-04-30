/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
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
    const [deltaTime] = useSimVar('L:A32NX_PUSHBACK_DELTA_TIME', 'number', 0);
    const [tugCommandedHeading] = useSimVar('L:A32NX_PUSHBACK_TUG_COMMANDED_HEADING', 'Number', 50);
    const [tugCommandedHeadingFactor, setTugCommandedHeadingFactor] = useSimVar('L:A32NX_PUSHBACK_TUG_COMMANDED_HEADING_FACTOR', 'Number', 50);
    const [tugCommandedSpeedFactor, setTugCommandedSpeedFactor] = useSimVar('L:A32NX_PUSHBACK_TUG_COMMANDED_SPEED_FACTOR', 'Number', 50);

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

    // Pause pushback
    useEffect(() => {
        if (pushBackPaused) {
            setPushbackWait(1);
        } else {
            setPushbackWait(0);
        }
    }, [pushBackPaused]);

    // protect against tug starting pushback while paused
    useEffect(() => {
        if (pushBackPaused && aircraftGroundSpeed.toFixed(2) > 0) {
            setPushbackWait(1);
            setTugCommandedSpeedFactor(0);
        }
    }, [aircraftGroundSpeed.toFixed(2)]);

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

    const [showDebugInfo, setShowDebugInfo] = useState(false);

    return (
        <div className="flex relative flex-col space-y-4 h-content-section-reduced">
            <div
                className="flex-grow rounded-lg border-2 border-theme-accent"
                onDoubleClick={() => setShowDebugInfo(!showDebugInfo)}
            >

                {/* TODO: Insert bing map here */}

                {showDebugInfo && (
                    <div className="flex flex-grow">
                        <div className="mx-4">
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
                            tugCommandedHeadingFactor:
                            {' '}
                            {tugCommandedHeadingFactor.toFixed(4)}
                            <br />
                            tugCommandedHeading:
                            {' '}
                            {tugCommandedHeading.toFixed(4)}
                            <br />
                            aircraftHeading:
                            {' '}
                            {aircraftHeading.toFixed(4)}
                            <br />
                            pushbackAngle:
                            {' '}
                            {pushbackAngle.toFixed(4)}
                            {' ('}
                            {(pushbackAngle * (180 / Math.PI)).toFixed(4)}
                            °)
                            <br />
                            Rotation Velocity X:
                            {' '}
                            {SimVar.GetSimVarValue('ROTATION VELOCITY BODY Y', 'Number').toFixed(4)}
                            <br />
                            Rotation Velocity Y:
                            {' '}
                            {SimVar.GetSimVarValue('ROTATION VELOCITY BODY X', 'Number').toFixed(4)}
                            <br />
                            Rotation Velocity Z:
                            {' '}
                            {SimVar.GetSimVarValue('ROTATION VELOCITY BODY Z', 'Number').toFixed(4)}
                        </div>
                        <div className="mx-4">
                            aircraftGroundSpeed:
                            {' '}
                            {aircraftGroundSpeed.toFixed(4)}
                            {'kts '}
                            (
                            {(aircraftGroundSpeed * 1.68781).toFixed(4)}
                            ft/s)
                            <br />
                            tugCommandedSpeed:
                            {' '}
                            {tugCommandedSpeedFactor}
                            <br />
                            tugCommandedVelocity:
                            {' '}
                            { (tugCommandedSpeedFactor * (parkingBrakeEngaged ? 0.4 : 4)).toFixed(4) }
                            <br />
                            Velocity X:
                            {' '}
                            {SimVar.GetSimVarValue('VELOCITY BODY Y', 'Number').toFixed(4)}
                            <br />
                            Velocity Y:
                            {' '}
                            {SimVar.GetSimVarValue('VELOCITY BODY X', 'Number').toFixed(4)}
                            <br />
                            Velocity Z:
                            {' '}
                            {SimVar.GetSimVarValue('VELOCITY BODY Z', 'Number').toFixed(4)}
                            {' '}
                        </div>
                    </div>
                )}
            </div>
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
                        <p className="font-bold text-unselected">R</p>
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
