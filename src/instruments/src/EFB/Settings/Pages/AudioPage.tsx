import React from 'react';

import { usePersistentNumberProperty } from '@instruments/common/persistence';
import Slider from 'rc-slider';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { SettingItem, SettingsPage } from '../Settings';

export const AudioPage = () => {
    const [ptuAudible, setPtuAudible] = usePersistentNumberProperty('SOUND_PTU_AUDIBLE_COCKPIT', 0);
    const [exteriorVolume, setExteriorVolume] = usePersistentNumberProperty('SOUND_EXTERIOR_MASTER', 0);
    const [engineVolume, setEngineVolume] = usePersistentNumberProperty('SOUND_INTERIOR_ENGINE', 0);
    const [windVolume, setWindVolume] = usePersistentNumberProperty('SOUND_INTERIOR_WIND', 0);
    const [passengerAmbienceEnabled, setPassengerAmbienceEnabled] = usePersistentNumberProperty('SOUND_PASSENGER_AMBIENCE_ENABLED', 1);
    const [announcementsEnabled, setAnnouncementsEnabled] = usePersistentNumberProperty('SOUND_ANNOUNCEMENTS_ENABLED', 1);
    const [boardingMusicEnabled, setBoardingMusicEnabled] = usePersistentNumberProperty('SOUND_BOARDING_MUSIC_ENABLED', 1);

    return (
        <SettingsPage name="Audio">
            <SettingItem name="PTU Audible in Cockpit" unrealistic>
                <Toggle value={!!ptuAudible} onToggle={(value) => setPtuAudible(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Exterior Master Volume">
                <div className="flex flex-row items-center space-x-8">
                    <Slider
                        style={{ width: '24rem' }}
                        value={exteriorVolume + 50}
                        onChange={(value) => setExteriorVolume(value - 50)}
                    />
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
                <div className="flex flex-row items-center space-x-8">
                    <Slider
                        style={{ width: '24rem' }}
                        value={engineVolume + 50}
                        onChange={(value) => setEngineVolume(value - 50)}
                    />
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
                <div className="flex flex-row items-center space-x-8">
                    <Slider
                        style={{ width: '24rem' }}
                        value={windVolume + 50}
                        onChange={(value) => setWindVolume(value - 50)}
                    />
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

            <SettingItem name="Passenger Ambience">
                <Toggle value={!!passengerAmbienceEnabled} onToggle={(value) => setPassengerAmbienceEnabled(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Announcements">
                <Toggle value={!!announcementsEnabled} onToggle={(value) => setAnnouncementsEnabled(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Boarding Music">
                <Toggle value={!!boardingMusicEnabled} onToggle={(value) => setBoardingMusicEnabled(value ? 1 : 0)} />
            </SettingItem>
        </SettingsPage>
    );
};
