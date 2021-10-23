/* eslint-disable max-len */
import React, { useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';

import { useSimVar } from '@instruments/common/simVars';
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

    return (
        <>
            {!showThrottleSettings
            && (
                <SettingsPage name="Sim Options">

                    <SettingItem name="Default Barometer Unit">
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

                    <SettingItem name="Sync MSFS Flight Plan">
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

                    <SettingItem name="External MCDU Server Port">
                        <SimpleInput
                            className="text-center w-30"
                            value={mcduServerPort}
                            onChange={(event) => {
                                setMcduServerPort(event);
                            }}
                        />
                    </SettingItem>

                    <SettingItem name="Enable MCDU Server Connection (Auto deactivates after 5 minutes if no successful connection)">
                        <SelectGroup>
                            <SelectItem
                                className="text-center color-red"
                                onSelect={() => setMcduServerEnabled('AUTO ON')}
                                selected={mcduServerEnabled === 'AUTO ON' || mcduServerEnabled === 'AUTO OFF'}

                            >
                                Auto
                            </SelectItem>
                            <SelectItem
                                onSelect={() => setMcduServerEnabled('PERM OFF')}
                                selected={mcduServerEnabled === 'PERM OFF'}
                            >
                                Off
                            </SelectItem>
                        </SelectGroup>
                        <div className="pt-2 text-center">
                            {mcduServerEnabled === 'AUTO ON' ? 'Active' : 'Inactive'}
                        </div>
                    </SettingItem>

                    <SettingItem name="Dynamic Registration Decal">
                        <Toggle value={dynamicRegistration === 'ENABLED'} onToggle={(value) => setDynamicRegistration(value ? 'ENABLED' : 'DISABLED')} />
                    </SettingItem>

                    <SettingItem name="Throttle Detents">
                        <button
                            type="button"
                            className="py-2.5 px-5 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body rounded-md border-2 border-theme-highlight transition duration-100"
                            onClick={() => setShowThrottleSettings(true)}
                        >
                            Calibrate
                        </button>
                    </SettingItem>

                    <SettingItem name="Use Calculated ILS Signals">
                        <Toggle
                            value={radioReceiverUsage === '1'}
                            onToggle={(value) => {
                                setRadioReceiverUsage(value ? '1' : '0');
                                setRadioReceiverUsageSimVar(value ? 1 : 0);
                            }}
                        />
                    </SettingItem>

                </SettingsPage>
            )}
            <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
        </>
    );
};
