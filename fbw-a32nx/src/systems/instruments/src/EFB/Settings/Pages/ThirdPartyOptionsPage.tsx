// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect } from 'react';
import { usePersistentNumberProperty } from '@flybywiresim/fbw-sdk';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SettingItem, SettingsPage } from '../Settings';
import { t } from '../../translation';

export const ThirdPartyOptionsPage = () => {
    const [gsxFuelSyncEnabled, setGsxFuelSyncEnabled] = usePersistentNumberProperty('GSX_FUEL_SYNC', 0);
    const [gsxPayloadSyncEnabled, setGsxPayloadSyncEnabled] = usePersistentNumberProperty('GSX_PAYLOAD_SYNC', 0);
    const [, setWheelChocksEnabled] = usePersistentNumberProperty('MODEL_WHEELCHOCKS_ENABLED', 1);
    const [, setConesEnabled] = usePersistentNumberProperty('MODEL_CONES_ENABLED', 1);

    useEffect(() => {
        if (gsxFuelSyncEnabled === 1 || gsxPayloadSyncEnabled === 1) {
            setWheelChocksEnabled(0);
            setConesEnabled(0);
        }
    }, [gsxFuelSyncEnabled, gsxPayloadSyncEnabled]);

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
