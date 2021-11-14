import React from 'react';

import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { Slider, Toggle } from '@flybywiresim/react-components';
import { SettingItem, SettingsPage } from '../Settings';

export const AudioPage = () => {
    const [ptuAudible, setPtuAudible] = usePersistentNumberProperty('SOUND_PTU_AUDIBLE_COCKPIT', 0);
    const [exteriorVolume, setExteriorVolume] = usePersistentNumberProperty('SOUND_EXTERIOR_MASTER', 0);
    const [engineVolume, setEngineVolume] = usePersistentNumberProperty('SOUND_INTERIOR_ENGINE', 0);
    const [windVolume, setWindVolume] = usePersistentNumberProperty('SOUND_INTERIOR_WIND', 0);

    return (
        <SettingsPage name="Audio">
            <SettingItem name="PTU Audible in Cockpit" unrealistic>
                <Toggle value={!!ptuAudible} onToggle={(value) => setPtuAudible(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Exterior Master Volume">
                <div className="flex flex-row items-center">
                    <span className="pr-3 text-base">{exteriorVolume}</span>
                    <Slider className="w-60" value={exteriorVolume + 50} onInput={(value) => setExteriorVolume(value - 50)} />
                </div>
            </SettingItem>

            <SettingItem name="Engine Interior Volume">
                <div className="flex flex-row items-center">
                    <span className="pr-3 text-base">{engineVolume}</span>
                    <Slider className="w-60" value={engineVolume + 50} onInput={(value) => setEngineVolume(value - 50)} />
                </div>
            </SettingItem>

            <SettingItem name="Wind Interior Volume">
                <div className="flex flex-row items-center">
                    <span className="pr-3 text-base">{windVolume}</span>
                    <Slider className="w-60" value={windVolume + 50} onInput={(value) => setWindVolume(value - 50)} />
                </div>
            </SettingItem>
        </SettingsPage>
    );
};
