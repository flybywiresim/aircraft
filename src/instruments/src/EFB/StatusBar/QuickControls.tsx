// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useMemo, useRef, useState } from 'react';
import {
    BrightnessHigh,
    BrightnessHighFill,
    Compass,
    Gear,
    Keyboard,
    MoonFill,
    PersonCheck,
    Power,
    Wifi,
    WifiOff,
} from 'react-bootstrap-icons';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import Slider from 'rc-slider';
import { useHistory } from 'react-router-dom';
import { useInterval } from '@flybywiresim/react-components';
import { t } from '../translation';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';
import { PowerStates, usePower } from '../Efb';
import { ClientState } from '../../../../simbridge-client/src';
import { SimBridgeClientState } from '../../../../simbridge-client/src/components/ClientState';

export const QuickControls = () => {
    const history = useHistory();
    const power = usePower();

    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness, setUsingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);
    const [autoOSK, setAutoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);

    const [adirsAlignTimeSimVar, setAdirsAlignTimeSimVar] = useSimVar('L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME', 'Enum', Number.MAX_SAFE_INTEGER);
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    const [, setSimbridgeEnabled] = usePersistentProperty('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');

    const [showQuickControlsPane, setShowQuickControlsPane] = useState(false);
    const [simBridgeClientState, setSimBridgeClientState] = useState<SimBridgeClientState>(SimBridgeClientState.OFF);

    // To prevent keyboard input (esp. END key for external view) to change
    // the slider position. This is accomplished by a
    // onAfterChange={() => sliderRef.current.blur()}
    // in the Slider component props.
    const brightnessSliderRef = useRef<any>(null);

    const handleAutoBrightness = () => {
        setUsingAutobrightness(usingAutobrightness ? 0 : 1);
    };

    const handleSleep = () => {
        history.push('/');
        power.setPowerState(PowerStates.STANDBY);
    };

    const handlePower = () => {
        history.push('/');
        power.setPowerState(PowerStates.SHUTOFF);
    };

    const handleAlignADIRS = () => {
        const previousAlignTimeVar = adirsAlignTimeSimVar;
        setAdirsAlignTimeSimVar(1);
        setTimeout(() => {
            setAdirsAlignTimeSimVar(previousAlignTimeVar);
        }, 500);
    };

    const handleInstantBoarding = () => {
        const previousBoardingRate = boardingRate;
        setBoardingRate('INSTANT');
        setTimeout(() => {
            setBoardingRate(previousBoardingRate);
        }, 500);
    };

    const handleResetSimBridgeConnection = () => {
        if (simBridgeClientState === SimBridgeClientState.CONNECTED || simBridgeClientState === SimBridgeClientState.CONNECTING) {
            setSimbridgeEnabled('PERM OFF');
            return;
        }
        setSimbridgeEnabled('AUTO ON');
    };

    const simBridgeButtonStyle = useMemo<string>(():string => {
        switch (simBridgeClientState) {
        case SimBridgeClientState.CONNECTED: return 'bg-utility-green text-theme-body';
        case SimBridgeClientState.CONNECTING: return 'bg-utility-amber text-theme-body';
        case SimBridgeClientState.OFFLINE: return 'bg-utility-red text-theme-body';
        default: return '';
        }
    }, [simBridgeClientState]);

    const simBridgeButtonStateString = useMemo<string>(():string => {
        switch (simBridgeClientState) {
        case SimBridgeClientState.CONNECTED: return t('QuickControls.SimBridgeConnected');
        case SimBridgeClientState.CONNECTING: return t('QuickControls.SimBridgeConnecting');
        case SimBridgeClientState.OFFLINE: return t('QuickControls.SimBridgeOffline');
        default: return t('QuickControls.SimBridgeOff');
        }
    }, [simBridgeClientState]);

    const handleSettings = () => {
        history.push('/settings/flypad');
    };

    useInterval(() => {
        if (showQuickControlsPane) {
            setSimBridgeClientState(ClientState.getInstance().getSimBridgeClientState());
        }
    }, 200);

    return (
        <>
            <TooltipWrapper text={t('StatusBar.TT.QuickControls')}>
                <div onClick={() => setShowQuickControlsPane((old) => !old)}>
                    <Gear size={26} />
                </div>
            </TooltipWrapper>
            {showQuickControlsPane
                && (
                    <div
                        className="absolute z-40 py-6 px-6 bg-theme-accent rounded-md border border-theme-secondary transition duration-100"
                        style={{ top: '40px', right: '50px', width: '620px', height: '320px' }}
                        onMouseLeave={() => setShowQuickControlsPane(false)}
                    >

                        <div className="flex flex-row justify-end items-center mb-8">
                            <div className="absolute left-0 ml-6 text-4xl">
                                Quick Settings
                            </div>
                            <TooltipWrapper text={t('QuickControls.TT.Settings')}>
                                <button
                                    type="button"
                                    onClick={handleSettings}
                                    className={`flex justify-center items-center ml-4 text-theme-text 
                                                   bg-theme-body hover:border-4 hover:border-theme-highlight rounded-md transition duration-100`}
                                    style={{ width: '80px', height: '50px' }}
                                >
                                    <Gear size={24} />
                                </button>
                            </TooltipWrapper>
                            <TooltipWrapper text={t('QuickControls.TT.Sleep')}>
                                <button
                                    type="button"
                                    onClick={handleSleep}
                                    className="flex justify-center items-center ml-4 text-theme-text
                                               bg-theme-body hover:border-4 hover:border-theme-highlight rounded-md transition duration-100"
                                    style={{ width: '80px', height: '50px' }}
                                >
                                    <MoonFill size={20} />
                                </button>
                            </TooltipWrapper>
                            <TooltipWrapper text={t('QuickControls.TT.PowerButton')}>
                                <button
                                    type="button"
                                    onClick={handlePower}
                                    className="flex justify-center items-center ml-4 text-theme-text
                                               bg-theme-body hover:border-4 hover:border-theme-highlight rounded-md transition duration-100"
                                    style={{ width: '80px', height: '50px' }}
                                >
                                    <Power size={24} />
                                </button>
                            </TooltipWrapper>
                        </div>

                        <div className="flex flex-row justify-between items-center mb-8">
                            <TooltipWrapper text={t('QuickControls.TT.AlignAdirs')}>
                                <button
                                    type="button"
                                    onClick={handleAlignADIRS}
                                    className="flex flex-col justify-center items-center text-theme-text
                                                   bg-theme-body hover:border-4 hover:border-theme-highlight rounded-md transition duration-100"
                                    style={{ width: '130px', height: '100px' }}
                                >
                                    <Compass size={42} />
                                    <div className="mt-1 text-sm text-inherit">
                                        Align ADIRS
                                    </div>
                                </button>
                            </TooltipWrapper>
                            <TooltipWrapper text={t('QuickControls.TT.FinishBoarding')}>
                                <button
                                    type="button"
                                    onClick={handleInstantBoarding}
                                    className="flex flex-col justify-center items-center text-theme-text
                                                   bg-theme-body hover:border-4 hover:border-theme-highlight rounded-md transition duration-100"
                                    style={{ width: '130px', height: '100px' }}
                                >
                                    <PersonCheck size={42} />
                                    <div className="mt-1 text-sm text-inherit">
                                        Finish Boarding
                                    </div>
                                </button>
                            </TooltipWrapper>
                            <TooltipWrapper text={t('QuickControls.TT.SimBridge')}>
                                <button
                                    type="button"
                                    onClick={handleResetSimBridgeConnection}
                                    className={`flex flex-col justify-center items-center text-theme-text  
                                                    bg-theme-body hover:border-4 hover:border-theme-highlight rounded-md transition 
                                                    duration-100 ${simBridgeButtonStyle}`}
                                    style={{ width: '130px', height: '100px' }}
                                >
                                    {simBridgeClientState === SimBridgeClientState.CONNECTED ? (
                                        <Wifi size={42} />
                                    ) : (
                                        <WifiOff size={42} />
                                    )}
                                    <div className="mt-1 text-sm text-inherit">
                                        SimBridge
                                        {' '}
                                        <br />
                                        {simBridgeButtonStateString}
                                    </div>
                                </button>
                            </TooltipWrapper>
                            <TooltipWrapper text={t('QuickControls.TT.OnScreenKeyboard')}>
                                <button
                                    type="button"
                                    onClick={() => setAutoOSK(autoOSK === 0 ? 1 : 0)}
                                    className={`flex flex-col justify-center items-center text-theme-text 
                                                   bg-theme-body hover:border-4 hover:border-theme-highlight rounded-md transition duration-100 ${autoOSK === 1 ? 'bg-utility-green' : ''}`}
                                    style={{ width: '130px', height: '100px' }}
                                >
                                    <Keyboard size={42} />
                                    <div className="mt-1 text-sm text-inherit">
                                        Onscreen Keyboard
                                    </div>
                                </button>
                            </TooltipWrapper>

                        </div>

                        <div className="flex flex-row justify-between items-center">
                            <div className={`flex flex-row items-center ${usingAutobrightness && 'opacity-30'}`}>
                                <TooltipWrapper text={t('QuickControls.TT.Brightness')}>
                                    <div className="flex flex-row items-center mr-4 w-[80px] text-theme-text">
                                        <BrightnessHighFill size={24} />
                                        <span className="ml-2 pointer-events-none text-inherit">
                                            {`${usingAutobrightness ? brightness.toFixed(0) : brightnessSetting}%`}
                                        </span>
                                    </div>
                                    <div>
                                        <Slider
                                            disabled={usingAutobrightness === 1}
                                            ref={brightnessSliderRef}
                                            value={usingAutobrightness ? brightness : brightnessSetting}
                                            min={1}
                                            max={100}
                                            onChange={setBrightnessSetting}
                                            onAfterChange={() => brightnessSliderRef.current && brightnessSliderRef.current.blur()}
                                            className="rounded-md"
                                            style={{ width: '380px', height: '50px', padding: '0' }}
                                            trackStyle={{ backgroundColor: 'var(--color-text)', height: '50px' }}
                                            railStyle={{ backgroundColor: 'var(--color-body)', height: '50px' }}
                                            handleStyle={{ top: '13px', height: '0px', width: '0px' }}
                                        />
                                    </div>
                                </TooltipWrapper>
                            </div>
                            <TooltipWrapper text={t('QuickControls.TT.AutoBrightness')}>
                                <button
                                    type="button"
                                    onClick={handleAutoBrightness}
                                    className={`flex justify-center items-center ml-4 text-theme-text 
                                                    bg-theme-body hover:border-4 hover:border-theme-highlight rounded-md 
                                                    transition duration-100 ${usingAutobrightness === 1 ? 'bg-utility-green text-theme-body' : ''}`}
                                    style={{ width: '80px', height: '50px' }}
                                >
                                    <BrightnessHigh size={24} />
                                </button>
                            </TooltipWrapper>
                        </div>

                    </div>
                )}
        </>
    );
};
