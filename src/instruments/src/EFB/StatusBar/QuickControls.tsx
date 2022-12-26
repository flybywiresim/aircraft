// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useRef, useState } from 'react';
import { Gear } from 'react-bootstrap-icons';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import Slider from 'rc-slider';
import { t } from '../translation';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';
import { SettingItem } from '../Settings/Settings';
import { Toggle } from '../UtilComponents/Form/Toggle';

export const QuickControls = () => {
    const [showQuickControlsPane, setShowQuickControlsPane] = useState(false);

    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);
    const [autoOSK, setAutoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);
    const [pilotAvatar, setPilotAvatar] = usePersistentNumberProperty('CONFIG_PILOT_AVATAR_VISIBLE', 0);
    const [firstOfficerAvatar, setFirstOfficerAvatar] = usePersistentNumberProperty('CONFIG_FIRST_OFFICER_AVATAR_VISIBLE', 0);

    const [adirsAlignTimeSimVar, setAdirsAlignTimeSimVar] = useSimVar('L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME', 'Enum', Number.MAX_SAFE_INTEGER);
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    const [, setSimbridgeEnabled] = usePersistentProperty('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');

    // To prevent keyboard input (esp. END key for external view) to change
    // the slider position. This is accomplished by a
    // onAfterChange={() => sliderRef.current.blur()}
    // in the Slider component props.
    const brightnessSliderRef = useRef<any>(null);

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
        setSimbridgeEnabled('PERM OFF');
        setTimeout(() => {
            setSimbridgeEnabled('AUTO ON');
        }, 1000);
    };

    return (
        <>
            {!usingAutobrightness && (
                <TooltipWrapper text={t('StatusBar.TT.QuickControls')}>
                    <div onClick={() => setShowQuickControlsPane((old) => !old)}>
                        <Gear size={26} />
                    </div>
                </TooltipWrapper>
            )}
            {showQuickControlsPane
                && (
                    <>
                        {/* popup shadow */}
                        <div
                            className="absolute py-6 px-6 bg-black rounded-md border border-black transition duration-100 z-39"
                            style={{ top: '50px', right: '40px', width: '40rem', height: '40rem' }}
                        />

                        {/* quick settings pane */}
                        <div
                            className="absolute z-40 py-6 px-6 bg-gray-700 rounded-md border border-theme-secondary transition duration-100"
                            style={{ top: '40px', right: '50px', width: '40rem', height: '40rem' }}
                            onMouseLeave={() => setShowQuickControlsPane(false)}
                        >

                            <h1>Quick Settings</h1>
                            <hr />

                            <SettingItem name={t('Settings.flyPad.Brightness')} disabled={!!usingAutobrightness} groupType="parent">
                                <Slider
                                    ref={brightnessSliderRef}
                                    className="ml-32"
                                    style={{ width: '18rem' }}
                                    value={usingAutobrightness ? brightness : brightnessSetting}
                                    onChange={setBrightnessSetting}
                                    onAfterChange={() => brightnessSliderRef.current.blur()}
                                />
                            </SettingItem>

                            <SettingItem name={t('Settings.flyPad.AutomaticallyShowOnscreenKeyboard')}>
                                <Toggle value={!!autoOSK} onToggle={(value) => setAutoOSK(value ? 1 : 0)} />
                            </SettingItem>

                            <SettingItem name={t('Settings.Realism.PilotAvatar')}>
                                <Toggle value={!!pilotAvatar} onToggle={(value) => setPilotAvatar(value ? 1 : 0)} />
                            </SettingItem>

                            <SettingItem name={t('Settings.Realism.FirstOfficerAvatar')}>
                                <Toggle value={!!firstOfficerAvatar} onToggle={(value) => setFirstOfficerAvatar(value ? 1 : 0)} />
                            </SettingItem>

                            <h1 className="mt-12">Quick Actions</h1>
                            <hr />

                            <div className="flex flex-row justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={handleAlignADIRS}
                                    className="flex justify-center h-18 p-4 w-min items-center text-theme-body hover:text-theme-highlight
                                               bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                >
                                    Align ADIRS
                                </button>

                                <button
                                    type="button"
                                    onClick={handleInstantBoarding}
                                    className="flex justify-center h-18 p-4 w-min items-center text-theme-body hover:text-theme-highlight
                                               bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                >
                                    Instant Boarding
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResetSimBridgeConnection}
                                    className="flex justify-center h-18 p-4 w-min whitespace-nowrap items-center text-theme-body hover:text-theme-highlight
                                               bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                                >
                                    Reset SimBridge Connection
                                </button>
                            </div>
                        </div>
                    </>
                )}
        </>
    );
};
