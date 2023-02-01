import React from 'react';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SettingItem, SettingsPage } from '../Settings';
import { t } from '../../translation';

export const ThirdPartyOptionsPage = () => {
    const [gsxFuelSyncEnabled, setGsxFuelSyncEnabled] = usePersistentNumberProperty('GSX_FUEL_SYNC', 0);
    const [gsxPayloadSyncEnabled, setGsxPayloadSyncEnabled] = usePersistentNumberProperty('GSX_PAYLOAD_SYNC', 0);

    return (
        <>
            <SettingsPage name={t('Settings.ThirdPartyOptions.Title')}>
                <SettingItem name={t('Settings.ThirdPartyOptions.GsxFuelEnabled')}>
                    <Toggle
                        value={gsxFuelSyncEnabled === 1}
                        onToggle={(value) => {
                            setGsxFuelSyncEnabled(value ? 1 : 0);
                        }}
                    />
                </SettingItem>
                <SettingItem name={t('Settings.ThirdPartyOptions.GsxPayloadEnabled')}>
                    <Toggle
                        value={gsxPayloadSyncEnabled === 1}
                        onToggle={(value) => {
                            setGsxPayloadSyncEnabled(value ? 1 : 0);
                        }}
                    />
                </SettingItem>
            </SettingsPage>
        </>
    );
};
