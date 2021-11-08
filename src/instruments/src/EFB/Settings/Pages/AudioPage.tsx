import React from 'react';

import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { Slider, Toggle } from '@flybywiresim/react-components';

export const AudioPage = () => {
    const [ptuAudible, setPtuAudible] = usePersistentNumberProperty('SOUND_PTU_AUDIBLE_COCKPIT', 0);
    const [exteriorVolume, setExteriorVolume] = usePersistentNumberProperty('SOUND_EXTERIOR_MASTER', 0);
    const [engineVolume, setEngineVolume] = usePersistentNumberProperty('SOUND_INTERIOR_ENGINE', 0);
    const [windVolume, setWindVolume] = usePersistentNumberProperty('SOUND_INTERIOR_WIND', 0);

    return (
        <div className="flex flex-col px-6 rounded-xl divide-y-2 divide-gray-700 bg-navy-lighter">
            <div className="flex flex-row justify-between items-center py-8">
                <span>
                    <span className="text-lg text-gray-300">PTU Audible in Cockpit</span>
                    <span className="ml-2 text-lg text-gray-500">(unrealistic)</span>
                </span>
                <Toggle value={!!ptuAudible} onToggle={(value) => setPtuAudible(value ? 1 : 0)} />
            </div>
            <div className="flex flex-row justify-between items-center py-4">
                <span className="text-lg text-gray-300">Exterior Master Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="pr-3 text-base">{exteriorVolume}</span>
                    <Slider className="w-60" value={exteriorVolume + 50} onInput={(value) => setExteriorVolume(value - 50)} />
                </div>
            </div>
            <div className="flex flex-row justify-between items-center py-4">
                <span className="text-lg text-gray-300">Engine Interior Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="pr-3 text-base">{engineVolume}</span>
                    <Slider className="w-60" value={engineVolume + 50} onInput={(value) => setEngineVolume(value - 50)} />
                </div>
            </div>
            <div className="flex flex-row justify-between items-center py-4">
                <span className="text-lg text-gray-300">Wind Interior Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="pr-3 text-base">{windVolume}</span>
                    <Slider className="w-60" value={windVolume + 50} onInput={(value) => setWindVolume(value - 50)} />
                </div>
            </div>
        </div>
    );
};
