import React from 'react';

import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import Slider from 'rc-slider';
import { languageOptions } from 'instruments/src/EFB/i18n';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';

export const FlyPadPage = () => {
    const [brightnessSetting, setBrightnessSetting] = usePersistentNumberProperty('EFB_BRIGHTNESS', 0);
    const [brightness] = useSimVar('L:A32NX_EFB_BRIGHTNESS', 'number', 500);
    const [usingAutobrightness, setUsingAutobrightness] = usePersistentNumberProperty('EFB_USING_AUTOBRIGHTNESS', 0);
    const [theme, setTheme] = usePersistentProperty('EFB_UI_THEME', 'blue');
    const [autoOSK, setAutoOSK] = usePersistentNumberProperty('EFB_AUTO_OSK', 0);
    const [timeDisplayed, setTimeDisplayed] = usePersistentProperty('EFB_TIME_DISPLAYED', 'utc');
    const [timeFormat, setTimeFormat] = usePersistentProperty('EFB_TIME_FORMAT', '24');
    const [showStatusBarFlightProgress, setShowStatusBarFlightProgress] = usePersistentNumberProperty('EFB_SHOW_STATUSBAR_FLIGHTPROGRESS', 1);
    const [usingColoredMetar, setUsingColoredMetar] = usePersistentNumberProperty('EFB_USING_COLOREDMETAR', 1);
    const [language, setLanguage] = usePersistentProperty('EFB_LANGUAGE', 'en');

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

    const handleThemeSelect = (theme: string) => {
        setTheme(theme);
        document.documentElement.classList.forEach((className) => {
            if (className.includes('theme-')) {
                document.documentElement.classList.remove(className);
            }
        });
        document.documentElement.classList.add(`theme-${theme}`);
    };

    return (
        <SettingsPage name="flyPad">
            <SettingItem name="Brightness" disabled={!!usingAutobrightness}>
                <div className="flex flex-row items-center space-x-8">
                    <Slider
                        style={{ width: '24rem' }}
                        value={usingAutobrightness ? brightness : brightnessSetting}
                        onChange={setBrightnessSetting}
                    />
                    <SimpleInput
                        min={1}
                        max={100}
                        value={usingAutobrightness ? brightness : brightnessSetting}
                        className="w-20 text-center"
                        onChange={(value) => setBrightnessSetting(parseInt(value))}
                        decimalPrecision={0}
                        number
                    />
                </div>
            </SettingItem>

            <SettingItem name="Auto Brightness">
                <Toggle value={!!usingAutobrightness} onToggle={(value) => setUsingAutobrightness(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Theme">
                <SelectGroup>
                    {themeButtons.map((button) => (
                        <SelectItem
                            onSelect={() => handleThemeSelect(button.setting)}
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

            <SettingItem name="Show Status Bar Flight Progress">
                <Toggle value={!!showStatusBarFlightProgress} onToggle={(value) => setShowStatusBarFlightProgress(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Show Colored Raw Metar">
                <Toggle value={!!usingColoredMetar} onToggle={(value) => setUsingColoredMetar(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name="Language">
                <SelectInput
                    className="w-64"
                    value={language}
                    onChange={(value) => setLanguage(value as string)}
                    options={languageOptions.map((option) => ({ value: option.langCode, displayValue: option.alias }))}
                />
            </SettingItem>
        </SettingsPage>
    );
};
