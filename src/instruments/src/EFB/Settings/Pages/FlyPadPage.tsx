import React from 'react';

import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import { Slider, Toggle } from '@flybywiresim/react-components';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';

export const FlyPadPage = () => {
    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness, setUsingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);
    const [theme, setTheme] = usePersistentProperty('EFB_THEME', 'blue');
    const [autoOSK, setAutoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);

    const themeButtons: ButtonType[] = [
        { name: 'Blue', setting: 'blue' },
        { name: 'Dark', setting: 'dark' },
        { name: 'Light', setting: 'light' },
    ];

    return (
        <SettingsPage name="flyPad">
            <SettingItem name="Brightness">
                <Slider className="w-60" value={usingAutobrightness ? brightness : brightnessSetting} onInput={(value) => setBrightnessSetting(value)} />
            </SettingItem>

            <SettingItem name="Auto Brightness">
                <Toggle value={!!usingAutobrightness} onToggle={(value) => setUsingAutobrightness(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Theme">
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
            </SettingItem>

            <SettingItem name="Automatically Show Onscreen Keyboard">
                <Toggle value={!!autoOSK} onToggle={(value) => setAutoOSK(value ? 1 : 0)} />
            </SettingItem>
        </SettingsPage>
    );
};
