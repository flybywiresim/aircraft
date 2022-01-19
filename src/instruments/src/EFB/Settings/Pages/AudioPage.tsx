import React from 'react';

import { usePersistentNumberProperty } from '@instruments/common/persistence';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import { Toggle } from '../../Components/Form/Toggle';
import { Slider } from '../../Components/Form/Slider';
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
                <div className="flex flex-row gap-x-4 items-center">
                    <Slider className="w-96" value={exteriorVolume + 50} onInput={(value) => setExteriorVolume(value - 50)} />
                    <SimpleInput
                        min={1}
                        max={100}
                        value={exteriorVolume + 50}
                        className="w-20 text-center"
                        onChange={(value) => setExteriorVolume(Number.parseInt(value) - 50)}
                        number
                    />
                </div>
            </SettingItem>

            <SettingItem name="Engine Interior Volume">
                <div className="flex flex-row gap-x-4 items-center">
                    <Slider className="w-96" value={engineVolume + 50} onInput={(value) => setEngineVolume(value - 50)} />
                    <SimpleInput
                        min={1}
                        max={100}
                        value={engineVolume + 50}
                        className="w-20 text-center"
                        onChange={(value) => setEngineVolume(Number.parseInt(value) - 50)}
                        number
                    />
                </div>
            </SettingItem>

            <SettingItem name="Wind Interior Volume">
                <div className="flex flex-row gap-x-4 items-center">
                    <Slider className="w-96" value={windVolume + 50} onInput={(value) => setWindVolume(value - 50)} />
                    <SimpleInput
                        min={1}
                        max={100}
                        value={windVolume + 50}
                        className="w-20 text-center"
                        onChange={(value) => setWindVolume(Number.parseInt(value) - 50)}
                        number
                    />
                </div>
            </SettingItem>
        </SettingsPage>
    );
};
