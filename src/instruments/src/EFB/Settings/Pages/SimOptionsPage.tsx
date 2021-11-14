import React, { useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import { Toggle } from '@flybywiresim/react-components';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';

import Button from '../../Components/Button/Button';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';

import ThrottleConfig from '../ThrottleConfig/ThrottleConfig';

type AdirsButton = {
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

    const adirsAlignTimeButtons: (ButtonType & AdirsButton)[] = [
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
                        className="w-30 ml-1.5 px-5 py-1.5 text-lg text-gray-300 rounded-lg bg-navy-light
                            border-2 border-navy-light focus-within:outline-none focus-within:border-teal-light-contrast text-center disabled"
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

                <SettingItem name="Throttle Detents">
                    <Button className="bg-teal-light-contrast border-teal-light-contrast" text="Calibrate" onClick={() => setShowThrottleSettings(true)} />
                </SettingItem>
            </SettingsPage>
        )}
            <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
        </div>
    );
};
