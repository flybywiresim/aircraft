import React, { useContext, useEffect, useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import { Toggle } from '@flybywiresim/react-components';
import { ButtonType, SettingsNavbarContext } from '../Settings';

import Button from '../../Components/Button/Button';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';

import ThrottleConfig from '../ThrottleConfig/ThrottleConfig';

type AdirsButton = {
    simVarValue: number,
}

const ControlSettings = ({ setShowSettings }) => (
    <div className="bg-navy-lighter divide-y-2 my-4 divide-gray-700 flex flex-col rounded-xl p-6">
        <div className="flex flex-row justify-between items-center">
            <span className="text-lg text-gray-300">Detents</span>
            <Button className="bg-teal-light-contrast border-teal-light-contrast" text="Calibrate" onClick={() => setShowSettings(true)} />
        </div>
    </div>
);

export const SimOptionsPage = () => {
    const [showThrottleSettings, setShowThrottleSettings] = useState(false);
    const { setShowNavbar } = useContext(SettingsNavbarContext);

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

    useEffect(() => {
        setShowNavbar(!showThrottleSettings);
    }, [showThrottleSettings]);

    return (
        <div>
            {!showThrottleSettings
        && (
            <>
                <div className="bg-navy-lighter rounded-xl px-6 divide-y-2 divide-gray-700 flex flex-col">
                    <div className="py-4 flex flex-row justify-between items-center">
                        <span className="text-lg text-gray-300">ADIRS Align Time</span>
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
                    </div>

                    <div className="py-4 flex flex-row justify-between items-center">
                        <span className="text-lg text-gray-300">DMC Self Test Time</span>
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
                    </div>

                    <div className="py-4 flex flex-row justify-between items-center">
                        <span className="text-lg text-gray-300 mr-1">Default Baro</span>
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
                    </div>
                    <div className="py-4 flex flex-row justify-between items-center">
                        <span>
                            <span className="text-lg text-gray-300">MCDU Keyboard Input</span>
                            <span className="text-lg text-gray-500 ml-2">(unrealistic)</span>
                        </span>
                        <Toggle value={mcduInput === 'ENABLED'} onToggle={(value) => setMcduInput(value ? 'ENABLED' : 'DISABLED')} />
                    </div>
                    <div className="py-4 flex flex-row justify-between items-center">
                        <span>
                            <span className="text-lg text-gray-300">MCDU Focus Timeout (s)</span>
                        </span>
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
                    </div>
                </div>
                <ControlSettings setShowSettings={setShowThrottleSettings} />
            </>
        )}
            <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
        </div>
    );
};
