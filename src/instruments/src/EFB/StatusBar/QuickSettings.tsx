// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useRef, useState } from 'react';
import { Gear } from 'react-bootstrap-icons';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import Slider from 'rc-slider';
import { t, tt } from '../translation';
import { TooltipWrapper } from '../UtilComponents/TooltipWrapper';
import { ButtonType, SettingItem } from '../Settings/Settings';
import { SelectGroup, SelectItem } from '../UtilComponents/Form/Select';
import { Toggle } from '../UtilComponents/Form/Toggle';

type SimVarButton = {
    simVarValue: number,
}

export const QuickSettings = () => {
    const [showQuickSettingPane, setShowQuickSettingPane] = useState(false);

    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);
    const [autoOSK, setAutoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);

    const [adirsAlignTime, setAdirsAlignTime] = usePersistentProperty('CONFIG_ALIGN_TIME', 'REAL');
    const [, setAdirsAlignTimeSimVar] = useSimVar('L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME', 'Enum', Number.MAX_SAFE_INTEGER);
    const [dmcSelfTestTime, setDmcSelfTestTime] = usePersistentProperty('CONFIG_SELF_TEST_TIME', '12');
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');

    const [simbridgeEnabled, setSimbridgeEnabled] = usePersistentProperty('CONFIG_SIMBRIDGE_ENABLED', 'AUTO ON');

    const adirsAlignTimeButtons: (ButtonType & SimVarButton)[] = [
        { name: t('Settings.Instant'), setting: 'INSTANT', simVarValue: 1 },
        { name: t('Settings.Fast'), setting: 'FAST', simVarValue: 2 },
        { name: t('Settings.Real'), setting: 'REAL', simVarValue: 0 },
    ];

    const dmcSelfTestTimeButtons: ButtonType[] = [
        { name: t('Settings.Instant'), setting: '0' },
        { name: t('Settings.Fast'), setting: '5' },
        { name: t('Settings.Real'), setting: '12' },
    ];

    const boardingRateButtons: ButtonType[] = [
        { name: t('Settings.Instant'), setting: 'INSTANT' },
        { name: t('Settings.Fast'), setting: 'FAST' },
        { name: t('Settings.Real'), setting: 'REAL' },
    ];

    // To prevent keyboard input (esp. END key for external view) to change
    // the slider position. This is accomplished by a
    // onAfterChange={() => sliderRef.current.blur()}
    // in the Slider component props.
    const brightnessSliderRef = useRef<any>(null);

    return (
        <>
            {!usingAutobrightness && (
                <TooltipWrapper text={t('StatusBar.TT.QuickSettings')}>
                    <div onClick={() => setShowQuickSettingPane((old) => !old)}>
                        <Gear size={26} />
                    </div>
                </TooltipWrapper>
            )}
            {showQuickSettingPane
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
                            onMouseLeave={() => setShowQuickSettingPane(false)}
                        >

                            <h1>Quick Settings</h1>
                            <div className="mb-8 divide-y-2 divide-white" />

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

                            <SettingItem name={t('Settings.Realism.AdirsAlignTime')}>
                                <SelectGroup className="ml-32">
                                    {adirsAlignTimeButtons.map((button) => (
                                        <SelectItem
                                            onSelect={() => {
                                                setAdirsAlignTime(button.setting);
                                                setAdirsAlignTimeSimVar(button.simVarValue);
                                            }}
                                            selected={adirsAlignTime === button.setting}
                                        >
                                            {button.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SettingItem>

                            <SettingItem name={t('Settings.Realism.DmcSelfTestTime')}>
                                <SelectGroup className="ml-32">
                                    {dmcSelfTestTimeButtons.map((button) => (
                                        <SelectItem
                                            onSelect={() => setDmcSelfTestTime(button.setting)}
                                            selected={dmcSelfTestTime === button.setting}
                                        >
                                            {button.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SettingItem>

                            <SettingItem name={t('Settings.Realism.BoardingTime')}>
                                <SelectGroup className="ml-32">
                                    {boardingRateButtons.map((button) => (
                                        <SelectItem
                                            onSelect={() => setBoardingRate(button.setting)}
                                            selected={boardingRate === button.setting}
                                        >
                                            {button.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SettingItem>

                            <SettingItem name={t('Settings.SimOptions.EnableSimBridge')}>
                                <SelectGroup className="ml-32">
                                    <SelectItem
                                        className="text-center color-red"
                                        onSelect={() => setSimbridgeEnabled('AUTO ON')}
                                        selected={simbridgeEnabled === 'AUTO ON' || simbridgeEnabled === 'AUTO OFF'}

                                    >
                                        {t('Settings.SimOptions.Auto')}
                                    </SelectItem>
                                    <SelectItem
                                        onSelect={() => setSimbridgeEnabled('PERM OFF')}
                                        selected={simbridgeEnabled === 'PERM OFF'}
                                    >
                                        {t('Settings.SimOptions.Off')}
                                    </SelectItem>
                                </SelectGroup>
                                <div className="pt-2 mr-14 text-right">
                                    {simbridgeEnabled === 'AUTO ON' ? t('Settings.SimOptions.Active') : t('Settings.SimOptions.Inactive')}
                                </div>
                            </SettingItem>

                        </div>
                    </>
                )}
        </>
    );
};
