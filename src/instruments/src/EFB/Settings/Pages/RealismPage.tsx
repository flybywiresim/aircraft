import React from 'react';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import { t } from '../../translation';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ButtonType, SettingGroup, SettingItem, SettingsPage } from '../Settings';

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
    const [autoFillChecklists, setAutoFillChecklists] = usePersistentNumberProperty('EFB_AUTOFILL_CHECKLISTS', 0);
    const [syncEfis, setFoEfis] = usePersistentNumberProperty('FO_SYNC_EFIS_ENABLED', 0);

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

    return (
        <SettingsPage name={t('Settings.Realism.Title')}>
            <SettingItem name={t('Settings.Realism.AdirsAlignTime')}>
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

            <SettingItem name={t('Settings.Realism.DmcSelfTestTime')}>
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

            <SettingItem name={t('Settings.Realism.BoardingTime')}>
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

            <SettingItem name={t('Settings.Realism.AutofillChecklists')} unrealistic>
                <Toggle value={!!autoFillChecklists} onToggle={(value) => setAutoFillChecklists(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name={t('Settings.Realism.HomeCockpitMode')}>
                <Toggle value={homeCockpit === '1'} onToggle={(value) => setHomeCockpit(value ? '1' : '0')} />
            </SettingItem>

            <SettingItem name={t('Settings.Realism.SeparateTillerFromRudderInputs')}>
                <Toggle value={!!realisticTiller} onToggle={(value) => setRealisticTiller(value ? 1 : 0)} />
            </SettingItem>

            <SettingGroup>
                <SettingItem name={t('Settings.Realism.McduKeyboardInput')} unrealistic groupType="parent">
                    <Toggle value={mcduInput === 'ENABLED'} onToggle={(value) => setMcduInput(value ? 'ENABLED' : 'DISABLED')} />
                </SettingItem>

                {mcduInput === 'ENABLED' && (
                    <SettingItem name={t('Settings.Realism.McduFocusTimeout')} groupType="sub">
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
                )}
            </SettingGroup>

            <SettingItem name={t('Settings.Realism.SyncEfis')} unrealistic>
                <Toggle value={!!syncEfis} onToggle={(value) => setFoEfis(value ? 1 : 0)} />
            </SettingItem>

        </SettingsPage>
    );
};
