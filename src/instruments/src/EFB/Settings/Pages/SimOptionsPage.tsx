import React, { useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';

import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';

import Button from '../../UtilComponents/Button/Button';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';

import { ThrottleConfig } from '../ThrottleConfig/ThrottleConfig';

export const SimOptionsPage = () => {
    const [showThrottleSettings, setShowThrottleSettings] = useState(false);

    const [defaultBaro, setDefaultBaro] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'AUTO');
    const [dynamicRegistration, setDynamicRegistration] = usePersistentProperty('DYNAMIC_REGISTRATION_DECAL', 'DISABLED');
    const [fpSync, setFpSync] = usePersistentProperty('FP_SYNC', 'LOAD');
    const [mcduServerPort, setMcduServerPort] = usePersistentProperty('CONFIG_EXTERNAL_MCDU_PORT', '8080');

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
                            noLabel
                            onChange={(event) => {
                                setMcduServerPort(event);
                            }}
                        />
                    </SettingItem>

                    <SettingItem name="Dynamic Registration Decal">
                        <Toggle value={dynamicRegistration === 'ENABLED'} onToggle={(value) => setDynamicRegistration(value ? 'ENABLED' : 'DISABLED')} />
                    </SettingItem>

                    <SettingItem name="Throttle Detents">
                        <Button className="bg-theme-highlight" text="Calibrate" onClick={() => setShowThrottleSettings(true)} />
                    </SettingItem>

                </SettingsPage>
            )}
            <ThrottleConfig isShown={showThrottleSettings} onClose={() => setShowThrottleSettings(false)} />
        </>
    );
};
