import React, { useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import { Toggle } from '../../Components/Form/Toggle';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';

import Button from '../../Components/Button/Button';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';

import ThrottleConfig from '../ThrottleConfig/ThrottleConfig';

type SimVarButton = {
    simVarValue: number,
}

export const SimOptionsPage = () => {
    const [showThrottleSettings, setShowThrottleSettings] = useState(false);

    const [adirsAlignTime, setAdirsAlignTime] = usePersistentProperty('CONFIG_ALIGN_TIME', 'REAL');
    const [, setAdirsAlignTimeSimVar] = useSimVar('L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME', 'Enum', Number.MAX_SAFE_INTEGER);
    const [dmcSelfTestTime, setDmcSelfTestTime] = usePersistentProperty('CONFIG_SELF_TEST_TIME', '12');
    const [defaultBaro, setDefaultBaro] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'AUTO');
    const [mcduInput, setMcduInput] = usePersistentProperty('MCDU_KB_INPUT', 'DISABLED');
    const [mcduTimeout, setMcduTimeout] = usePersistentProperty('CONFIG_MCDU_KB_TIMEOUT', '60');
    const [dynamicRegistration, setDynamicRegistration] = usePersistentProperty('DYNAMIC_REGISTRATION_DECAL', 'DISABLED');
    const [fpSync, setFpSync] = usePersistentProperty('FP_SYNC', 'LOAD');
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    const [realisticTiller, setRealisticTiller] = usePersistentProperty('REALISTIC_TILLER_ENABLED', '0');
    const [mcduServerPort, setMcduServerPort] = usePersistentProperty('CONFIG_EXTERNAL_MCDU_PORT', '8080');

    const adirsAlignTimeButtons: (ButtonType & SimVarButton)[] = [
        { name: 'Instant', setting: 'INSTANT', simVarValue: 1 },
        { name: 'Fast', setting: 'FAST', simVarValue: 2 },
        { name: 'Real', setting: 'REAL', simVarValue: 0 },
    ];

    const dmcSelfTestTimeButtons: ButtonType[] = [
        { name: 'Instant', setting: '0' },
        { name: 'Fast', setting: '5' },
        { name: 'Real', setting: '12' },
    ];

    const defaultBaroButtons: ButtonType[] = [
        { name: 'Auto', setting: 'AUTO' },
        { name: 'in Hg', setting: 'IN HG' },
        { name: 'hPa', setting: 'HPA' },
    ];

    const fpSyncButtons: ButtonType[] = [
        { name: 'None', setting: 'NONE' },
        { name: 'Load Only', setting: 'LOAD' },
        { name: 'Save', setting: 'SAVE' },
    ];

    const boardingRateButtons: ButtonType[] = [
        { name: 'Instant', setting: 'INSTANT' },
        { name: 'Fast', setting: 'FAST' },
        { name: 'Real', setting: 'REAL' },
    ];

    const steeringSeparationButtons: (ButtonType & SimVarButton)[] = [
        { name: 'Disabled', setting: '0', simVarValue: 0 },
        { name: 'Enabled', setting: '1', simVarValue: 1 },
    ];

    return (
        <div>
            {!showThrottleSettings
            && (
                <SettingsPage name="Sim Options">
                    <SettingItem name="ADIRS Align Time">
                        <SelectGroup>
                            {adirsAlignTimeButtons.map((button) => (
                                <SelectItem
                                    enabled
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

                    <SettingItem name="DMC Self Test Time">
                        <SelectGroup>
                            {dmcSelfTestTimeButtons.map((button) => (
                                <SelectItem
                                    enabled
                                    onSelect={() => setDmcSelfTestTime(button.setting)}
                                    selected={dmcSelfTestTime === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SettingItem>

                    <SettingItem name="Default Barometer Unit">
                        <SelectGroup>
                            {defaultBaroButtons.map((button) => (
                                <SelectItem
                                    enabled
                                    onSelect={() => setDefaultBaro(button.setting)}
                                    selected={defaultBaro === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SettingItem>

                    <SettingItem name="MCDU Keyboard Input" unrealistic>
                        <Toggle value={mcduInput === 'ENABLED'} onToggle={(value) => setMcduInput(value ? 'ENABLED' : 'DISABLED')} />
                    </SettingItem>

                    <SettingItem name="MCDU Focus Timeout (seconds)">
                        <SimpleInput
                            className="text-center w-30"
                            value={mcduTimeout}
                            noLabel
                            min={5}
                            max={120}
                            disabled={(mcduInput !== 'ENABLED')}
                            onChange={(event) => {
                                if (!Number.isNaN(event) && parseInt(event) >= 5 && parseInt(event) <= 120) {
                                    setMcduTimeout(event.trim());
                                }
                            }}
                        />
                    </SettingItem>

                    <SettingItem name="Dynamic Registration Decal">
                        <Toggle value={dynamicRegistration === 'ENABLED'} onToggle={(value) => setDynamicRegistration(value ? 'ENABLED' : 'DISABLED')} />
                    </SettingItem>

                    <SettingItem name="Sync MSFS Flight Plan">
                        <SelectGroup>
                            {fpSyncButtons.map((button) => (
                                <SelectItem
                                    enabled
                                    onSelect={() => setFpSync(button.setting)}
                                    selected={fpSync === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SettingItem>

                    <SettingItem name="Boarding Time">
                        <SelectGroup>
                            {boardingRateButtons.map((button) => (
                                <SelectItem
                                    enabled
                                    onSelect={() => setBoardingRate(button.setting)}
                                    selected={boardingRate === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SettingItem>

                    <SettingItem name="Separate Tiller from Rudder Inputs">
                        <SelectGroup>
                            {steeringSeparationButtons.map((button) => (
                                <SelectItem
                                    enabled
                                    onSelect={() => setRealisticTiller(button.setting)}
                                    selected={realisticTiller === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SettingItem>
                    <SettingItem name="External MCDU Server Port">
                        <SimpleInput
                            className="text-center w-30"
                            value={mcduServerPort}
                            noLabel
                            onChange={(event) => {
                                setMcduServerPort(event);
                            }}
                        />
                    </SettingItem>

                    <SettingItem name="Throttle Detents">
                        <Button className="bg-theme-highlight" text="Calibrate" onClick={() => setShowThrottleSettings(true)} />
                    </SettingItem>
                </SettingsPage>
            )}
            <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
        </div>
    );
};
