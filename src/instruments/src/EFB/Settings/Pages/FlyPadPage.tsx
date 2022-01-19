import React from 'react';

import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import { Toggle } from '../../Components/Form/Toggle';
import { Slider } from '../../Components/Form/Slider';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';

export const FlyPadPage = () => {
    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness, setUsingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);
    const [theme, setTheme] = usePersistentProperty('EFB_THEME', 'blue');
    const [autoOSK, setAutoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);
    const [timeDisplayed, setTimeDisplayed] = usePersistentProperty('EFB_TIME_DISPLAYED', 'utc');
    const [timeFormat, setTimeFormat] = usePersistentProperty('EFB_TIME_FORMAT', '24');

    const themeButtons: ButtonType[] = [
        { name: 'Blue', setting: 'blue' },
        { name: 'Dark', setting: 'dark' },
        { name: 'Light', setting: 'light' },
    ];

    const timeDisplayButtons: ButtonType[] = [
        { name: 'UTC', setting: 'utc' },
        { name: 'Local', setting: 'local' },
        { name: 'UTC and Local', setting: 'both' },
    ];

    const timeFormatButtons: ButtonType[] = [
        { name: '12 Hour', setting: '12' },
        { name: '24 Hour', setting: '24' },
    ];

    return (
        <SettingsPage name="flyPad">
            <SettingItem name="Brightness" disabled={!!usingAutobrightness}>
                <Slider className="w-96" value={usingAutobrightness ? brightness : brightnessSetting} onInput={(value) => setBrightnessSetting(value)} />
            </SettingItem>

            <SettingItem name="Auto Brightness">
                <Toggle value={!!usingAutobrightness} onToggle={(value) => setUsingAutobrightness(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Theme">
                <SelectGroup>
                    {themeButtons.map((button) => (
                        <SelectItem
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

            <SettingItem name="Time Displayed">
                <SelectGroup>
                    {timeDisplayButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setTimeDisplayed(button.setting)}
                            selected={timeDisplayed === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="Local Time Format" disabled={timeDisplayed === 'utc'}>
                <SelectGroup>
                    {timeFormatButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setTimeFormat(button.setting)}
                            selected={timeFormat === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>
        </SettingsPage>
    );
};
