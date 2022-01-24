import { usePersistentProperty } from '@instruments/common/persistence';
import React, { useState } from 'react';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ButtonType, SettingItem, SettingsPage } from '../Settings';

export const AircraftOptionsPinProgramsPage = () => {
    const [thrustReductionHeight, setThrustReductionHeight] = usePersistentProperty('CONFIG_THR_RED_ALT', '1500');
    const [thrustReductionHeightSetting, setThrustReductionHeightSetting] = useState(thrustReductionHeight);
    const [accelerationHeight, setAccelerationHeight] = usePersistentProperty('CONFIG_ACCEL_ALT', '1500');
    const [accelerationHeightSetting, setAccelerationHeightSetting] = useState(accelerationHeight);
    const [accelerationOutHeight, setAccelerationOutHeight] = usePersistentProperty('CONFIG_ENG_OUT_ACCEL_ALT', '1500');
    const [accelerationOutHeightSetting, setAccelerationOutHeightSetting] = useState(accelerationOutHeight);

    const [usingMetric, setUsingMetric] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [paxSigns, setPaxSigns] = usePersistentProperty('CONFIG_USING_PORTABLE_DEVICES', '0');
    const [isisBaro, setIsisBaro] = usePersistentProperty('ISIS_BARO_UNIT_INHG', '0');
    const [isisMetricAltitude, setIsisMetricAltitude] = usePersistentProperty('ISIS_METRIC_ALTITUDE', '0');
    const [vhfSpacing, setVhfSpacing] = usePersistentProperty('RMP_VHF_SPACING_25KHZ', '0');

    const handleSetThrustReductionAlt = (value: string) => {
        setThrustReductionHeightSetting(value);

        const parsedValue = parseInt(value);

        if (parsedValue >= 400 && parsedValue <= 5000) {
            setThrustReductionHeight(value.trim());
        }
    };

    const handleSetAccelerationAlt = (value: string) => {
        setAccelerationHeightSetting(value);

        const parsedValue = parseInt(value);

        if (parsedValue >= 400 && parsedValue <= 10000) {
            setAccelerationHeight(value.trim());
        }
    };

    const handleSetAccelerationOutAlt = (value: string) => {
        setAccelerationOutHeightSetting(value);

        const parsedValue = parseInt(value);

        if (parsedValue >= 400 && parsedValue <= 10000) {
            setAccelerationOutHeight(value.trim());
        }
    };

    const paxSignsButtons: ButtonType[] = [
        { name: 'No Smoking', setting: '0' },
        { name: 'No Portable Device', setting: '1' },
    ];

    const weightUnitButtons: ButtonType[] = [
        { name: 'kg', setting: '1' },
        { name: 'lbs', setting: '0' },
    ];

    const isisBaroButtons: ButtonType[] = [
        { name: 'hPa', setting: '0' },
        { name: 'hPa/inHg', setting: '1' },
    ];

    const isisMetricAltitudeButtons: ButtonType[] = [
        { name: 'Disabled', setting: '0' },
        { name: 'Enabled', setting: '1' },
    ];

    const vhfSpacingButtons: ButtonType[] = [
        { name: '8.33 kHz', setting: '0' },
        { name: '25 kHz', setting: '1' },
    ];

    return (
        <SettingsPage name="Aircraft Options / Pin Programs">
            <SettingItem name="Thrust Reduction Height (ft)">
                <SimpleInput
                    className="text-center w-30"
                    placeholder={thrustReductionHeight}
                    noLabel
                    value={thrustReductionHeightSetting}
                    min={400}
                    max={5000}
                    onChange={(event) => handleSetThrustReductionAlt(event)}
                />
            </SettingItem>
            <SettingItem name="Acceleration Height (ft)">
                <SimpleInput
                    className="text-center w-30"
                    placeholder={accelerationHeight}
                    noLabel
                    value={accelerationHeightSetting}
                    min={400}
                    max={10000}
                    onChange={(event) => handleSetAccelerationAlt(event)}
                />
            </SettingItem>
            <SettingItem name="Engine-Out Acceleration Height (ft)">
                <SimpleInput
                    className="text-center w-30"
                    placeholder={accelerationOutHeight}
                    noLabel
                    value={accelerationOutHeightSetting}
                    min={400}
                    max={10000}
                    onChange={(event) => handleSetAccelerationOutAlt(event)}
                />
            </SettingItem>
            <SettingItem name="Weight Unit">
                <SelectGroup>
                    {weightUnitButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setUsingMetric(button.setting)}
                            selected={usingMetric === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="PAX Signs">
                <SelectGroup>
                    {paxSignsButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setPaxSigns(button.setting)}
                            selected={paxSigns === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="ISIS Baro Unit">
                <SelectGroup>
                    {isisBaroButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setIsisBaro(button.setting)}
                            selected={isisBaro === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="ISIS Metric Altitude">
                <SelectGroup>
                    {isisMetricAltitudeButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setIsisMetricAltitude(button.setting)}
                            selected={isisMetricAltitude === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>

            <SettingItem name="RMP VHF Spacing">
                <SelectGroup>
                    {vhfSpacingButtons.map((button) => (
                        <SelectItem
                            onSelect={() => setVhfSpacing(button.setting)}
                            selected={vhfSpacing === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SettingItem>
        </SettingsPage>
    );
};
