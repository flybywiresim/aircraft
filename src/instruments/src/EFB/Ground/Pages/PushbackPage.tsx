// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect, useRef } from 'react';
import { useSimVar, useSplitSimVar } from '@instruments/common/simVars';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight, ArrowsAngleContract, ArrowsAngleExpand,
    ArrowUp,
    ChevronDoubleDown,
    ChevronDoubleUp,
    ChevronLeft,
    ChevronRight, DashCircle, DashCircleFill,
    PauseCircleFill,
    PlayCircleFill, ToggleOff, ToggleOn,
    TruckFlatbed,
} from 'react-bootstrap-icons';
import Slider from 'rc-slider';
import { MathUtils } from '@shared/MathUtils';
import { toast } from 'react-toastify';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { PromptModal, useModals } from '../../UtilComponents/Modals/Modals';
import { PushbackMap } from './PushbackMap';

export const PushbackPage = () => {
    const { showModal } = useModals();

    const [simOnGround] = useSimVar('SIM ON GROUND', 'bool', 250);
    const [flightPhase] = useSimVar('L:A32NX_FMGC_FLIGHT_PHASE', 'enum', 250);

    // This is used to completely turn off the pushback for compatibility with other
    // pushback add-ons. Only watching sim variables like PUSHBACK STATE or
    // Pushback Available leads to conflicts as other add-on also read/write them.
    // It is implemented as a LVAR to allow 3rd parties to see that the a32nx pushback is active
    // and to be able to deactivate themselves or the a32nx pushback system if required.
    const [pushbackSystemEnabled, setPushbackSystemEnabled] = useSimVar('L:A32NX_PUSHBACK_SYSTEM_ENABLED', 'bool', 100);

    const [pushbackState, setPushbackState] = useSplitSimVar('PUSHBACK STATE', 'enum', 'K:TOGGLE_PUSHBACK', 'bool', 100);
    const [pushbackWait, setPushbackWait] = useSimVar('Pushback Wait', 'bool', 100);
    const [pushbackAttached] = useSimVar('Pushback Attached', 'bool', 100);
    const [pushbackAngle] = useSimVar('PUSHBACK ANGLE', 'Radians', 100);

    const [rudderPosition] = useSimVar('L:A32NX_RUDDER_PEDAL_POSITION', 'number', 50);
    const [elevatorPosition] = useSimVar('L:A32NX_SIDESTICK_POSITION_Y', 'number', 50);

    const [planeGroundSpeed] = useSimVar('GROUND VELOCITY', 'Knots', 100);
    const [planeHeadingTrue] = useSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 100);
    const [planeHeadingMagnetic] = useSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees', 100);

    const [parkingBrakeEngaged, setParkingBrakeEngaged] = useSimVar('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool', 250);
    const [nwStrgDisc] = useSimVar('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool', 250);

    const [pushbackPaused, setPushbackPaused] = useSimVar('L:A32NX_PUSHBACK_PAUSED', 'bool', 250);
    const [tugCmdHdgFactor, setCmdHdgFactor] = useSimVar('L:A32NX_PUSHBACK_HDG_FACTOR', 'number', 100);
    const [tugCmdSpdFactor, setCmdSpdFactor] = useSimVar('L:A32NX_PUSHBACK_SPD_FACTOR', 'number', 100);

    // debug info only - can be removed eventually
    const [tugCmdHdg] = useSimVar('L:A32NX_PUSHBACK_HDG', 'number', 100);
    const [tugCmdSpd] = useSimVar('L:A32NX_PUSHBACK_SPD', 'number', 100);
    const [tugInertiaSpeed] = useSimVar('L:A32NX_PUSHBACK_INERTIA_SPD', 'number', 100);
    const [updateDeltaTime] = useSimVar('L:A32NX_PUSHBACK_UPDT_DELTA', 'number', 0);
    const [showDebugInfo, setShowDebugInfo] = useSimVar('L:A32NX_PUSHBACK_DEBUG', 'bool', 100);

    // Required so these can be used inside the useEffect return callback
    const pushBackAttachedRef = useRef(pushbackAttached);
    pushBackAttachedRef.current = pushbackAttached;
    const pushbackPausedRef = useRef(pushbackPaused);
    pushbackPausedRef.current = pushbackPaused;

    const pushbackUIAvailable: boolean = simOnGround;
    const tugInTransit: boolean = pushbackAttached !== nwStrgDisc;
    const pushbackActive: boolean = pushbackSystemEnabled && !tugInTransit && nwStrgDisc;

    const releaseTug = () => {
        setPushbackState(3);
        setPushbackWait(0);
        // This alone does not suffice to fully release the tug.
        // A "TUG_DISABLE" event has to be sent. But if sent too early it gets
        // ignored by the sim sometimes and the aircraft would not steer.
        // See the useEffect [nwStrgDisc] in Efb.tsx - it fires this event when the
        // NW STRG DISC message disappears which is also the moment when the
        // nose wheel visually starts turning again.
    };

    const callTug = () => {
        setPushbackState(0);
        setPushbackWait(1);
    };

    const handleEnableSystem = () => {
        if (pushbackSystemEnabled) {
            if (pushbackState < 3) {
                showModal(
                    <PromptModal
                        title={t('Pushback.DisableSystemMessageTitle')}
                        bodyText={`${t('Pushback.DisableSystemMessageBody')}`}
                        onConfirm={() => {
                            releaseTug();
                        }}
                    />,
                );
            } else {
                setPushbackSystemEnabled(0);
            }
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
        if (pushbackState < 3) {
            releaseTug();
            return;
        }
        callTug();
    };

    const handlePause = () => {
        if (!pushbackPaused) {
            setCmdHdgFactor(0);
            setCmdSpdFactor(0);
        }
        setPushbackPaused(!pushbackPaused);
    };

    const handleTugSpeed = (speed: number) => {
        setCmdSpdFactor(MathUtils.clamp(speed, -1, 1));
        if (speed) {
            setPushbackPaused(false);
        }
    };

    const handleTugDirectionLeft = () => {
        handleTugDirection(tugCmdHdgFactor - 0.1);
    };

    const handleTugDirectionRight = () => {
        handleTugDirection(tugCmdHdgFactor + 0.1);
    };

    const handleTugDirection = (value: number) => {
        setCmdHdgFactor(MathUtils.clamp(value, -1, 1));
    };

    // called once when loading and unloading the page
    useEffect(() => {
        // when loading the page
        setPushbackPaused(true);

        // when unloading the page
        // !obs: as with setInterval no access to current local variable values
        return (() => {
            if (pushBackAttachedRef.current && !pushbackPausedRef.current) {
                toast.info(t('Pushback.LeavePageMessage'), {
                    autoClose: 750,
                    hideProgressBar: true,
                    closeButton: false,
                });
                setPushbackPaused(() => true);
            }
        });
    }, []);

    // Update commanded heading from rudder input
    useEffect(() => {
        if (!pushbackActive) {
            return;
        }
        // create deadzone
        if (rudderPosition > -0.05 && rudderPosition < 0.05) {
            setCmdHdgFactor(0);
            return;
        }
        setCmdHdgFactor(rudderPosition / 100);
    }, [rudderPosition]);

    // Update commanded speed from elevator input
    useEffect(() => {
        if (!pushbackActive) {
            return;
        }
        // create deadzone
        if (elevatorPosition > -0.05 && elevatorPosition < 0.05) {
            setCmdSpdFactor(0);
            return;
        }
        setPushbackPaused(false);
        setCmdSpdFactor(-elevatorPosition);
    }, [elevatorPosition]);

    // Make sure to deactivate the pushback system completely when leaving ground
    useEffect(() => {
        if (flightPhase !== 0 && flightPhase !== 7) {
            setPushbackSystemEnabled(simOnGround);
        }
    }, [simOnGround]);

    // Debug info for pushback movement - can be removed eventually
    const debugInformation = () => (
        <div className="flex absolute right-0 left-0 z-50 flex-grow justify-between mx-4 font-mono text-black bg-gray-100 border-gray-100 opacity-50">
            <div className="overflow-hidden text-black text-m">
                pushbackSystemEnabled:
                {' '}
                {pushbackSystemEnabled}
                <br />
                deltaTime:
                {' '}
                {updateDeltaTime.toFixed(4)}
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
                tugInTransit:
                {' '}
                {tugInTransit ? 'true' : 'false'}
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
                °)
                <br />
                NW STRG DISC MEMO
                {' '}
                { SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'Bool')}
                <br />
                Steer Input Control:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('STEER INPUT CONTROL', 'Percent Over 100'), 3).toFixed(3)}
                <br />
                Gear Steer Angle:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('GEAR STEER ANGLE PCT:0', 'Percent Over 100'), 3).toFixed(3)}
            </div>
            <div className="overflow-hidden text-black text-m">
                Heading (True):
                {' '}
                {planeHeadingTrue.toFixed(4)}
                <br />
                Heading (Magnetic):
                {' '}
                {planeHeadingMagnetic.toFixed(4)}
                <br />
                tCHeadingF:
                {' '}
                {tugCmdHdgFactor.toFixed(3)}
                <br />
                tCHeading :
                {' '}
                {tugCmdHdg.toFixed(3)}
                <br />
                Rotation Velocity X:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ROTATION VELOCITY BODY Y', 'Number'), 3).toFixed(3)}
                <br />
                Rotation Velocity Y:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ROTATION VELOCITY BODY X', 'Number'), 3).toFixed(3)}
                <br />
                {' '}
                Rotation Velocity Z:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ROTATION VELOCITY BODY Z', 'Number'), 3).toFixed(3)}
                <br />
                {' '}
                Rot. Accel. X:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ROTATION ACCELERATION BODY X', 'radians per second squared'), 3).toFixed(3)}
                <br />
                {' '}
                Rot. Accel. Y:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ROTATION ACCELERATION BODY Y', 'radians per second squared'), 3).toFixed(3)}
                <br />
                {' '}
                Rot. Accel Z:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ROTATION ACCELERATION BODY Z', 'radians per second squared'), 3).toFixed(3)}
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
                tCSpeedFactor:
                {' '}
                {tugCmdSpdFactor.toFixed(3)}
                <br />
                tCSpeed:
                {' '}
                {tugCmdSpd.toFixed(3)}
                <br />
                tInertiaSpeed:
                {' '}
                {tugInertiaSpeed.toFixed(3)}
                <br />
                Velocity X:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('VELOCITY BODY Y', 'Number'), 3).toFixed(3)}
                <br />
                Velocity Y:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('VELOCITY BODY X', 'Number'), 3).toFixed(3)}
                <br />
                Velocity Z:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('VELOCITY BODY Z', 'Number'), 3).toFixed(3)}
                <br />
                {' '}
                Accel. X:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ACCELERATION BODY X', 'feet per second squared'), 3).toFixed(3)}
                <br />
                {' '}
                Accel. Y:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ACCELERATION BODY Y', 'feet per second squared'), 3).toFixed(3)}
                <br />
                {' '}
                Accel Z:
                {' '}
                {MathUtils.round(SimVar.GetSimVarValue('ACCELERATION BODY Z', 'feet per second squared'), 3).toFixed(3)}
            </div>
        </div>
    );

    // To prevent keyboard input (esp. END key for external view) to change
    // the slider position. This is accomplished by a
    // onAfterChange={() => sliderRef.current.blur()}
    // in the Slider component props.
    const directionSliderRef = useRef<any>(null);
    const speedSliderRef = useRef<any>(null);

    const callTugLabel = () => {
        if (pushbackActive) {
            return (t('Pushback.TugAttached'));
        }
        if (tugInTransit) {
            return (t('Pushback.TugInTransit'));
        }
        return (t('Pushback.CallTug'));
    };

    return (
        <>
            <div className="flex relative flex-col space-y-4 w-full h-full">

                {/* Map Container */}
                <div className="flex flex-col flex-grow space-y-4">
                    <PushbackMap />
                </div>

                <div className="absolute right-0 left-0">
                    {showDebugInfo ? debugInformation() : <></>}
                </div>

                {/* Show message when not on ground */}
                {!pushbackUIAvailable && (
                    <div className="absolute top-2/3 text-center bu left-0 right-0 text-5xl border-white border-2}">
                        {t('Pushback.AvailableOnlyOnGround')}
                    </div>
                )}

                {/* Manual Pushback Controls */}
                <div className={`flex flex-col p-6 h-full space-y-4 rounded-lg border-2 border-theme-accent ${!pushbackUIAvailable && 'opacity-20 pointer-events-none'}`}>
                    <div className="flex flex-row space-x-4">

                        {/* Pushback System enabled On/Off */}
                        {pushbackSystemEnabled ? (
                            <div className="w-full">
                                <p
                                    className="text-center"
                                    onDoubleClick={() => setShowDebugInfo((old) => !old)}
                                >
                                    {t('Pushback.SystemEnabledOn')}
                                </p>
                                <TooltipWrapper text={t('Pushback.TT.SystemEnabledOn')}>
                                    <button
                                        type="button"
                                        onClick={handleEnableSystem}
                                        className="flex justify-center items-center w-full h-20 text-theme-text bg-green-600 rounded-md border-2 border-theme-accent opacity-60 hover:opacity-100 transition duration-100"
                                    >
                                        <ToggleOn size={50} />
                                    </button>
                                </TooltipWrapper>
                            </div>
                        ) : (
                            <div className="w-full">
                                <p
                                    className="text-center"
                                    onDoubleClick={() => setShowDebugInfo((old) => !old)}
                                >
                                    {t('Pushback.SystemEnabledOff')}
                                </p>
                                <TooltipWrapper text={t('Pushback.TT.SystemEnabledOff')}>
                                    <button
                                        type="button"
                                        onClick={handleEnableSystem}
                                        className={`flex justify-center items-center w-full h-20 text-theme-text bg-red-600 rounded-md border-2 border-theme-accent opacity-60 hover:opacity-100 transition duration-100 {${!pushbackUIAvailable && 'opacity-30 pointer-events-none'}`}
                                    >
                                        <ToggleOff size={50} />
                                    </button>
                                </TooltipWrapper>
                            </div>
                        )}

                        {/* Call Tug */}
                        <div className={`w-full ${!pushbackSystemEnabled && 'opacity-30 pointer-events-none'}`}>
                            <p className="text-center">
                                {callTugLabel()}
                            </p>
                            <TooltipWrapper text={t('Pushback.TT.CallReleaseTug')}>
                                <button
                                    type="button"
                                    onClick={handleCallTug}
                                    className={`flex justify-center items-center w-full h-20 text-theme-text rounded-md border-2 border-theme-accent opacity-60 hover:opacity-100 transition duration-100'} ${tugInTransit ? 'bg-utility-amber' : 'bg-green-600'} ${!pushbackSystemEnabled && 'opacity-30 pointer-events-none'}`}
                                >
                                    <TruckFlatbed size={50} />
                                    {' '}
                                    {pushbackActive ? (
                                        <ArrowsAngleContract className="ml-4" size={40} />
                                    ) : (
                                        <ArrowsAngleExpand className="ml-4" size={40} />
                                    )}
                                </button>
                            </TooltipWrapper>
                        </div>

                        {/* Parking Brake */}
                        <div className="w-full">
                            <p className="text-center jus">
                                {t('Pushback.ParkingBrake.Title')}
                                {' '}
                                {parkingBrakeEngaged ? t('Pushback.ParkingBrake.On') : t('Pushback.ParkingBrake.Off')}
                            </p>
                            <TooltipWrapper text={t('Pushback.TT.SetReleaseParkingBrake')}>
                                <button
                                    type="button"
                                    onClick={() => setParkingBrakeEngaged((old) => !old)}
                                    className={`w-full h-20 rounded-md transition duration-100 flex items-center justify-center text-utility-white opacity-60 hover:opacity-100  ${parkingBrakeEngaged ? 'bg-red-600' : 'bg-green-600'} {${!pushbackUIAvailable && 'opacity-30 pointer-events-none'}`}
                                >
                                    {parkingBrakeEngaged ? (
                                        <DashCircleFill className="transform" size={40} />
                                    ) : (
                                        <DashCircle className="transform -rotate-90" size={40} />
                                    )}
                                </button>
                            </TooltipWrapper>
                        </div>
                    </div>

                    <div className={`flex flex-row space-x-4 ${!pushbackActive && 'opacity-30 pointer-events-none'}`}>

                        {/* Backward Button */}
                        <div className="w-full">
                            <p className="text-center">
                                {t('Pushback.Backward')}
                            </p>
                            <TooltipWrapper text={t('Pushback.TT.DecreaseSpeed')}>
                                <button
                                    type="button"
                                    className="flex justify-center items-center w-full h-20 hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                    onClick={() => handleTugSpeed(tugCmdSpdFactor - 0.1)}
                                >
                                    <ArrowDown size={40} />
                                </button>
                            </TooltipWrapper>
                        </div>

                        {/* Forward Button */}
                        <div className="w-full">
                            <p className="text-center">
                                {t('Pushback.Forward')}
                            </p>
                            <TooltipWrapper text={t('Pushback.TT.IncreaseSpeed')}>
                                <button
                                    type="button"
                                    className="flex justify-center items-center w-full h-20 hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                    onClick={() => handleTugSpeed(tugCmdSpdFactor + 0.1)}
                                >
                                    <ArrowUp size={40} />
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
                                    className="flex justify-center items-center w-full h-20 hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                >
                                    {pushbackPaused ? (
                                        <PlayCircleFill size={40} />
                                    ) : (
                                        <PauseCircleFill size={40} />
                                    )}
                                </button>
                            </TooltipWrapper>
                        </div>

                        {/* Left Button */}
                        <div className="w-full">
                            <p className="text-center">
                                {t('Pushback.Left')}
                            </p>
                            <TooltipWrapper text={t('Pushback.TT.Left')}>
                                <button
                                    type="button"
                                    className="flex justify-center items-center w-full h-20 hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                    onClick={() => handleTugDirectionLeft()}
                                >
                                    <ArrowLeft size={40} />
                                </button>
                            </TooltipWrapper>
                        </div>

                        {/* Right Button */}
                        <div className="w-full">
                            <p className="text-center">
                                {t('Pushback.Right')}
                            </p>
                            <TooltipWrapper text={t('Pushback.TT.Right')}>
                                <button
                                    type="button"
                                    className="flex justify-center items-center w-full h-20 hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                    onClick={() => handleTugDirectionRight()}
                                >
                                    <ArrowRight size={40} />
                                </button>
                            </TooltipWrapper>
                        </div>
                    </div>

                    {/* Direction Slider */}
                    <div className={`${!pushbackActive && 'opacity-30 pointer-events-none'}`}>
                        <p className="text-center">
                            {t('Pushback.TugDirection')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.SliderDirection')}>
                            <div className="flex flex-row items-center space-x-4">
                                <p className="font-bold text-unselected"><ChevronLeft /></p>
                                <Slider
                                    ref={directionSliderRef}
                                    onChange={(value) => handleTugDirection(value)}
                                    onAfterChange={() => directionSliderRef.current.blur()}
                                    min={-1}
                                    step={0.01}
                                    max={1}
                                    value={tugCmdHdgFactor}
                                    startPoint={0}
                                />
                                <p className="font-bold text-unselected"><ChevronRight /></p>
                            </div>
                        </TooltipWrapper>
                    </div>

                    {/* Speed Slider */}
                    <div className={`${!pushbackActive && 'opacity-30 pointer-events-none'}`}>
                        <p className="text-center">
                            {t('Pushback.TugSpeed')}
                        </p>
                        <TooltipWrapper text={t('Pushback.TT.SliderSpeed')}>
                            <div className="flex flex-row items-center space-x-4">
                                <p className="font-bold text-unselected"><ChevronDoubleDown /></p>
                                <Slider
                                    ref={speedSliderRef}
                                    onChange={(value) => handleTugSpeed(value)}
                                    onAfterChange={() => speedSliderRef.current.blur()}
                                    min={-1}
                                    step={0.1}
                                    max={1}
                                    value={tugCmdSpdFactor}
                                    startPoint={0}
                                />
                                <p className="font-bold text-unselected">
                                    <ChevronDoubleUp />
                                </p>
                            </div>
                        </TooltipWrapper>
                    </div>
                </div>
            </div>
        </>
    );
};
