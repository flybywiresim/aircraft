import React from 'react';

import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import { Slider, Toggle } from '@flybywiresim/react-components';
import { ButtonType } from '../Settings';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';

export const FlyPadPage = () => {
    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness, setUsingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);
    const [theme, setTheme] = usePersistentProperty('EFB_THEME', 'blue');

    const themeButtons: ButtonType[] = [
        { name: 'Blue', setting: 'blue' },
        { name: 'Dark', setting: 'dark' },
        { name: 'Light', setting: 'light' },
    ];

    return (
        <div className="bg-navy-lighter rounded-xl px-6 divide-y divide-gray-700 flex flex-col">
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Brightness</span>
                <div className={`flex flex-row items-center py-1.5 ${usingAutobrightness && 'pointer-events-none filter saturate-0'}`}>
                    <Slider className="w-60" value={usingAutobrightness ? brightness : brightnessSetting} onInput={(value) => setBrightnessSetting(value)} />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Auto Brightness</span>
                <div className="flex flex-row items-center py-1.5">
                    <Toggle value={!!usingAutobrightness} onToggle={(value) => setUsingAutobrightness(value ? 1 : 0)} />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Auto Brightness</span>
                <div className="flex flex-row items-center py-1.5">
                <SelectGroup>
                    {themeButtons.map((button) => (
                        <SelectItem
                            enabled
                            onSelect={() => setTheme(button.setting)}
                            selected={theme === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
                </div>
            </div>
        </div>
    );
};
