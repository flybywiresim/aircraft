import React from 'react';
import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SettingItem, SettingsPage } from '../Settings';
import { t } from '../../translation';

export const GsxOptionsPage = () => {
    const [gsxFuelSyncEnabled, setGsxFuelSyncEnabled] = usePersistentNumberProperty('GSX_FUEL_SYNC', 0);
    const [gsxPayloadSyncEnabled, setGsxPayloadSyncEnabled] = usePersistentNumberProperty('GSX_PAYLOAD_SYNC', 0);
    const [gsxDeIceSyncEnabled, setGsxDeIceSyncEnabled] = usePersistentNumberProperty('GSX_DE_ICE_SYNC', 0);

    return (
        <>
            <SettingsPage name={t('Settings.GsxOptions.Title')}>
                <SettingItem name={t('Settings.GsxOptions.GsxFuelEnabled')}>
                    <Toggle
                        value={gsxFuelSyncEnabled === 1}
                        onToggle={(value) => {
                            setGsxFuelSyncEnabled(value ? 1 : 0);
                        }}
                    />
                </SettingItem>
                <SettingItem name={t('Settings.GsxOptions.GsxPayloadEnabled')}>
                    <Toggle
                        value={gsxPayloadSyncEnabled === 1}
                        onToggle={(value) => {
                            setGsxPayloadSyncEnabled(value ? 1 : 0);
                        }}
                    />
                </SettingItem>
                {/* Disabled until we do some kind of de-ice simulation */}
                <SettingItem name={t('Settings.GsxOptions.GsxDeIceEnabled')} disabled>
                    <Toggle
                        value={gsxDeIceSyncEnabled === 1}
                        onToggle={(value) => {
                            setGsxDeIceSyncEnabled(value ? 1 : 0);
                        }}
                    />
                </SettingItem>
            </SettingsPage>
        </>
    );
};
