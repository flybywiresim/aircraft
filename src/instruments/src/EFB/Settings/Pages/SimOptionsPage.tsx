/* eslint-disable max-len */
import React, { useState } from 'react';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';

import { useSimVar } from '@instruments/common/simVars';
import { t } from '../../translation';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';

import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';

import { ThrottleConfig } from '../ThrottleConfig/ThrottleConfig';

export const SimOptionsPage = () => {
    const [showThrottleSettings, setShowThrottleSettings] = useState(false);

    const [defaultBaro, setDefaultBaro] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'AUTO');
    const [dynamicRegistration, setDynamicRegistration] = usePersistentProperty('DYNAMIC_REGISTRATION_DECAL', 'DISABLED');
    const [fpSync, setFpSync] = usePersistentProperty('FP_SYNC', 'LOAD');
    const [mcduServerPort, setMcduServerPort] = usePersistentProperty('CONFIG_EXTERNAL_MCDU_PORT', '8380');
    const [mcduServerEnabled, setMcduServerEnabled] = usePersistentProperty('CONFIG_EXTERNAL_MCDU_SERVER_ENABLED', 'AUTO ON');
    const [radioReceiverUsage, setRadioReceiverUsage] = usePersistentProperty('RADIO_RECEIVER_USAGE_ENABLED', '0');
    const [, setRadioReceiverUsageSimVar] = useSimVar('L:A32NX_RADIO_RECEIVER_USAGE_ENABLED', 'number', 0);
    const [wheelChocksEnabled, setWheelChocksEnabled] = usePersistentNumberProperty('MODEL_WHEELCHOCKS_ENABLED', 1);
    const [conesEnabled, setConesEnabled] = usePersistentNumberProperty('MODEL_CONES_ENABLED', 1);

    const defaultBaroButtons: ButtonType[] = [
        { name: t('Settings.SimOptions.Auto'), setting: 'AUTO' },
        { name: t('Settings.SimOptions.inHg'), setting: 'IN HG' },
        { name: t('Settings.SimOptions.Hpa'), setting: 'HPA' },
    ];

    const fpSyncButtons: ButtonType[] = [
        { name: t('Settings.SimOptions.None'), setting: 'NONE' },
        { name: t('Settings.SimOptions.LoadOnly'), setting: 'LOAD' },
        { name: t('Settings.SimOptions.Save'), setting: 'SAVE' },
    ];

    return (
        <>
            {!showThrottleSettings
            && (
                <SettingsPage name={t('Settings.SimOptions.Title')}>
                    <SettingItem name={t('Settings.SimOptions.DefaultBarometerUnit')}>
                        <SelectGroup>
                            {defaultBaroButtons.map((button) => (
                                <SelectItem
                                    onSelect={() => setDefaultBaro(button.setting)}
                                    selected={defaultBaro === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SettingItem>

                    <SettingItem name={t('Settings.SimOptions.SyncMsfsFlightPlan')}>
                        <SelectGroup>
                            {fpSyncButtons.map((button) => (
                                <SelectItem
                                    onSelect={() => setFpSync(button.setting)}
                                    selected={fpSync === button.setting}
                                >
                                    {button.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SettingItem>

                    <SettingItem name={t('Settings.SimOptions.EnabledMcduServerConnectionAutoDeactivatesAfter5MinutesIfNoSuccessfulConnection')}>
                        <SelectGroup>
                            <SelectItem
                                className="text-center color-red"
                                onSelect={() => setMcduServerEnabled('AUTO ON')}
                                selected={mcduServerEnabled === 'AUTO ON' || mcduServerEnabled === 'AUTO OFF'}

                            >
                                {t('Settings.SimOptions.Auto')}
                            </SelectItem>
                            <SelectItem
                                onSelect={() => setMcduServerEnabled('PERM OFF')}
                                selected={mcduServerEnabled === 'PERM OFF'}
                            >
                                {t('Settings.SimOptions.Off')}
                            </SelectItem>
                        </SelectGroup>
                        <div className="pt-2 text-center">
                            {mcduServerEnabled === 'AUTO ON' ? t('Settings.SimOptions.Active') : t('Settings.SimOptions.Inactive')}
                        </div>
                    </SettingItem>

                    <SettingItem name={t('Settings.SimOptions.ExternalMcduServerPort')}>
                        <SimpleInput
                            className="text-center w-30"
                            value={mcduServerPort}
                            onChange={(event) => {
                                setMcduServerPort(event);
                            }}
                        />
                    </SettingItem>

                    <SettingItem name={t('Settings.SimOptions.DynamicRegistrationDecal')}>
                        <Toggle value={dynamicRegistration === 'ENABLED'} onToggle={(value) => setDynamicRegistration(value ? 'ENABLED' : 'DISABLED')} />
                    </SettingItem>

                    <SettingItem name={t('Settings.SimOptions.UseCalculatedIlsSignals')}>
                        <Toggle
                            value={radioReceiverUsage === '1'}
                            onToggle={(value) => {
                                setRadioReceiverUsage(value ? '1' : '0');
                                setRadioReceiverUsageSimVar(value ? 1 : 0);
                            }}
                        />
                    </SettingItem>

                    <SettingItem name={t('Settings.SimOptions.WheelChocksEnabled')}>
                        <Toggle
                            value={wheelChocksEnabled === 1}
                            onToggle={(value) => {
                                setWheelChocksEnabled(value ? 1 : 0);
                            }}
                        />
                    </SettingItem>

                    <SettingItem name={t('Settings.SimOptions.ConesEnabled')}>
                        <Toggle
                            value={conesEnabled === 1}
                            onToggle={(value) => {
                                setConesEnabled(value ? 1 : 0);
                            }}
                        />
                    </SettingItem>

                    <SettingItem name={t('Settings.SimOptions.ThrottleDetents')}>
                        <button
                            type="button"
                            className="py-2.5 px-5 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                            onClick={() => setShowThrottleSettings(true)}
                        >
                            {t('Settings.SimOptions.Calibrate')}
                        </button>
                    </SettingItem>

                </SettingsPage>
            )}
            <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
        </>
    );
};
