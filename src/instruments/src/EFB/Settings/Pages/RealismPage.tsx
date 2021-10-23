import React from 'react';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';

import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';

type SimVarButton = {
    simVarValue: number,
}

export const RealismPage = () => {
    const [adirsAlignTime, setAdirsAlignTime] = usePersistentProperty('CONFIG_ALIGN_TIME', 'REAL');
    const [, setAdirsAlignTimeSimVar] = useSimVar('L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME', 'Enum', Number.MAX_SAFE_INTEGER);
    const [dmcSelfTestTime, setDmcSelfTestTime] = usePersistentProperty('CONFIG_SELF_TEST_TIME', '12');
    const [mcduInput, setMcduInput] = usePersistentProperty('MCDU_KB_INPUT', 'DISABLED');
    const [mcduTimeout, setMcduTimeout] = usePersistentProperty('CONFIG_MCDU_KB_TIMEOUT', '60');
    const [boardingRate, setBoardingRate] = usePersistentProperty('CONFIG_BOARDING_RATE', 'REAL');
    const [realisticTiller, setRealisticTiller] = usePersistentNumberProperty('REALISTIC_TILLER_ENABLED', 0);
    const [homeCockpit, setHomeCockpit] = usePersistentProperty('HOME_COCKPIT_ENABLED', '0');
    const [datalinkTransmissionTime, setDatalinkTransmissionTime] = usePersistentProperty('CONFIG_DATALINK_TRANSMISSION_TIME', 'FAST');
    const [, setDatalinkTransmissionTimeSimVar] = useSimVar('L:A32NX_CONFIG_DATALINK_TIME', 'number', 0);
    const [autoFillChecklists, setAutoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);

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

    const boardingRateButtons: ButtonType[] = [
        { name: 'Instant', setting: 'INSTANT' },
        { name: 'Fast', setting: 'FAST' },
        { name: 'Real', setting: 'REAL' },
    ];

    const datalinkTransmissionTimeButtons: (ButtonType & SimVarButton)[] = [
        { name: 'Instant', setting: 'INSTANT', simVarValue: 1 },
        { name: 'Fast', setting: 'FAST', simVarValue: 2 },
        { name: 'Real', setting: 'REAL', simVarValue: 0 },
    ];

    return (
        <SettingsPage name="Realism">
            <SettingItem name="ADIRS Align Time">
                <SelectGroup>
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

            <SettingItem name="DMC Self Test Time">
                <SelectGroup>
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

            <SettingItem name="Boarding Time">
                <SelectGroup>
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

            <SettingItem name="MCDU Keyboard Input" unrealistic>
                <Toggle value={mcduInput === 'ENABLED'} onToggle={(value) => setMcduInput(value ? 'ENABLED' : 'DISABLED')} />
            </SettingItem>

            <SettingItem name="MCDU Focus Timeout (seconds)">
                <SimpleInput
                    className="text-center w-30"
                    value={mcduTimeout}
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

            <SettingItem name="Separate Tiller from Rudder Inputs">
                <Toggle value={!!realisticTiller} onToggle={(value) => setRealisticTiller(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Cockpit Mode">
                <Toggle value={homeCockpit === '1'} onToggle={(value) => setHomeCockpit(value ? '1' : '0')} />
            </SettingItem>

            <SettingItem name="DATALINK Transmission Time">
                <SelectGroup>
                    {datalinkTransmissionTimeButtons.map((button) => (
                        <SelectItem
                            onSelect={() => {
                                setDatalinkTransmissionTime(button.setting);
                                setDatalinkTransmissionTimeSimVar(button.simVarValue);
                            }}
                            selected={datalinkTransmissionTime === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="Autofill Checklists" unrealistic>
                <Toggle value={!!autoFillChecklists} onToggle={(value) => setAutoFillChecklists(value ? 1 : 0)} />
            </SettingItem>

        </SettingsPage>
    );
};
