import React from 'react';

import { usePersistentNumberProperty } from '@instruments/common/persistence';
import { Slider, Toggle } from '@flybywiresim/react-components';

export const AudioPage = () => {
    const [ptuAudible, setPtuAudible] = usePersistentNumberProperty('SOUND_PTU_AUDIBLE_COCKPIT', 0);
    const [exteriorVolume, setExteriorVolume] = usePersistentNumberProperty('SOUND_EXTERIOR_MASTER', 0);
    const [engineVolume, setEngineVolume] = usePersistentNumberProperty('SOUND_INTERIOR_ENGINE', 0);
    const [windVolume, setWindVolume] = usePersistentNumberProperty('SOUND_INTERIOR_WIND', 0);

    return (
        <div className="bg-navy-lighter divide-y divide-gray-700 flex flex-col rounded-xl px-6 ">
            <div className="py-8 flex flex-row justify-between items-center">
                <span>
                    <span className="text-lg text-gray-300">PTU Audible in Cockpit</span>
                    <span className="text-lg text-gray-500 ml-2">(unrealistic)</span>
                </span>
                <Toggle value={!!ptuAudible} onToggle={(value) => setPtuAudible(value ? 1 : 0)} />
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Exterior Master Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="text-base pr-3">{exteriorVolume}</span>
                    <Slider className="w-60" value={exteriorVolume + 50} onInput={(value) => setExteriorVolume(value - 50)} />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Engine Interior Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="text-base pr-3">{engineVolume}</span>
                    <Slider className="w-60" value={engineVolume + 50} onInput={(value) => setEngineVolume(value - 50)} />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Wind Interior Volume</span>
                <div className="flex flex-row items-center py-1.5">
                    <span className="text-base pr-3">{windVolume}</span>
                    <Slider className="w-60" value={windVolume + 50} onInput={(value) => setWindVolume(value - 50)} />
                </div>
            </div>
        </div>
    );
};
