import React, { useRef } from 'react';

import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';

import Slider from 'rc-slider';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ButtonType, SettingItem, SettingsPage, SettingGroup } from '../Settings';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { keyboardLayoutOptions } from '../../UtilComponents/KeyboardWrapper';
import { languageOptions, tt } from '../../translation';

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
    const [keyboardLayout, setKeyboardLayout] = usePersistentProperty('EFB_KEYBOARD_LAYOUT_IDENT', 'english');
    const [batteryLifeEnabled, setBatteryLifeEnabled] = usePersistentNumberProperty('EFB_BATTERY_LIFE_ENABLED', 1);

    // the tt() is a special case to update the page with the correct language after user
    // changes the language. the change to simvar hooks changed timing/order of updates.

    const themeButtons: ButtonType[] = [
        { name: tt('Settings.flyPad.Blue', language), setting: 'blue' },
        { name: tt('Settings.flyPad.Dark', language), setting: 'dark' },
        { name: tt('Settings.flyPad.Light', language), setting: 'light' },
    ];

    const timeDisplayButtons: ButtonType[] = [
        { name: tt('Settings.flyPad.Utc', language), setting: 'utc' },
        { name: tt('Settings.flyPad.Local', language), setting: 'local' },
        { name: tt('Settings.flyPad.UtcAndLocal', language), setting: 'both' },
    ];

    const timeFormatButtons: ButtonType[] = [
        { name: tt('Settings.flyPad.TwelveHours', language), setting: '12' },
        { name: tt('Settings.flyPad.TwentyFourHours', language), setting: '24' },
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

    // To prevent keyboard input (esp. END key for external view) to change
    // the slider position. This is accomplished by a
    // onAfterChange={() => sliderRef.current.blur()}
    // in the Slider component props.
    const brightnessSliderRef = useRef<any>(null);

    return (
        <SettingsPage name={tt('Settings.flyPad.Title', language)}>
            <SettingItem name={tt('Settings.flyPad.Language', language)}>
                <SelectInput
                    className="w-72"
                    value={language}
                    onChange={(value) => setLanguage(value as string)}
                    options={languageOptions.map((option) => ({ value: option.langCode, displayValue: `${option.alias}`, tooltip: `${option.langName}` }))}
                    maxHeight={32}
                />
            </SettingItem>

            <SettingItem name={tt('Settings.flyPad.OnscreenKeyboardLayout', language)}>
                <SelectInput
                    className="w-64"
                    value={keyboardLayout}
                    onChange={(value) => setKeyboardLayout(value as string)}
                    options={keyboardLayoutOptions.map((option) => ({ value: option.name, displayValue: option.alias }))}
                    maxHeight={32}
                />
            </SettingItem>

            <SettingItem name={tt('Settings.flyPad.AutomaticallyShowOnscreenKeyboard', language)}>
                <Toggle value={!!autoOSK} onToggle={(value) => setAutoOSK(value ? 1 : 0)} />
            </SettingItem>

            <SettingGroup>
                <SettingItem name={tt('Settings.flyPad.AutoBrightness', language)} groupType="parent">
                    <Toggle value={!!usingAutobrightness} onToggle={(value) => setUsingAutobrightness(value ? 1 : 0)} />
                </SettingItem>
                {!usingAutobrightness && (
                    <SettingItem name={tt('Settings.flyPad.Brightness', language)} disabled={!!usingAutobrightness} groupType="parent">
                        <div className="flex flex-row items-center space-x-8">
                            <>
                                <Slider
                                    ref={brightnessSliderRef}
                                    style={{ width: '24rem' }}
                                    value={usingAutobrightness ? brightness : brightnessSetting}
                                    onChange={setBrightnessSetting}
                                    onAfterChange={() => brightnessSliderRef.current.blur()}
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
                            </>
                        </div>
                    </SettingItem>
                )}
            </SettingGroup>

            <SettingItem name={tt('Settings.flyPad.BatteryLifeEnabled', language)}>
                <Toggle value={!!batteryLifeEnabled} onToggle={(value) => setBatteryLifeEnabled(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name={tt('Settings.flyPad.ShowStatusBarFlightProgressIndicator', language)}>
                <Toggle value={!!showStatusBarFlightProgress} onToggle={(value) => setShowStatusBarFlightProgress(value ? 1 : 0)} />
            </SettingItem>

            <SettingItem name={tt('Settings.flyPad.ShowColoredRawMetar', language)}>
                <Toggle value={!!usingColoredMetar} onToggle={(value) => setUsingColoredMetar(value ? 1 : 0)} />
            </SettingItem>

            <SettingGroup>
                <SettingItem name={tt('Settings.flyPad.TimeDisplayed', language)} groupType="parent">
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
                {timeDisplayed !== 'utc' && (
                    <SettingItem name={tt('Settings.flyPad.LocalTimeFormat', language)} groupType="sub" disabled={timeDisplayed === 'utc'}>
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
                )}
            </SettingGroup>

            <SettingItem name={tt('Settings.flyPad.Theme', language)}>
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

        </SettingsPage>
    );
};
