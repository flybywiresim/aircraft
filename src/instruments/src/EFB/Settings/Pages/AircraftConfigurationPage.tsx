import React from 'react';

import { usePersistentProperty } from '@instruments/common/persistence';

import { ButtonType } from '../Settings';
import { SelectGroup, SelectItem } from '../../Components/Form/Select';

export const AircraftConfigurationPage = () => {
    const [weightUnit, setWeightUnit] = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1');
    const [paxSigns, setPaxSigns] = usePersistentProperty('CONFIG_USING_PORTABLE_DEVICES', '0');
    const [isisBaro, setIsisBaro] = usePersistentProperty('ISIS_BARO_UNIT_INHG', '0');
    const [isisMetricAltitude, setIsisMetricAltitude] = usePersistentProperty('ISIS_METRIC_ALTITUDE', '0');
    const [vhfSpacing, setVhfSpacing] = usePersistentProperty('RMP_VHF_SPACING_25KHZ', '0');

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
        <div className="bg-navy-lighter rounded-xl px-6 divide-y-2 divide-gray-700 flex flex-col">
            <div className="py-4 flex-grow flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300 mr-1">Weight Unit</span>
                <SelectGroup>
                    {weightUnitButtons.map((button) => (
                        <SelectItem
                            enabled
                            onSelect={() => setWeightUnit(button.setting)}
                            selected={weightUnit === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>

            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">PAX Signs</span>
                <SelectGroup>
                    {paxSignsButtons.map((button) => (
                        <SelectItem
                            enabled
                            onSelect={() => setPaxSigns(button.setting)}
                            selected={paxSigns === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>

            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">ISIS Baro Unit</span>
                <SelectGroup>
                    {isisBaroButtons.map((button) => (
                        <SelectItem
                            enabled
                            onSelect={() => setIsisBaro(button.setting)}
                            selected={isisBaro === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>

            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">ISIS Metric Altitude</span>
                <SelectGroup>
                    {isisMetricAltitudeButtons.map((button) => (
                        <SelectItem
                            enabled
                            onSelect={() => setIsisMetricAltitude(button.setting)}
                            selected={isisMetricAltitude === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>

            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">RMP VHF Spacing</span>
                <SelectGroup>
                    {vhfSpacingButtons.map((button) => (
                        <SelectItem
                            enabled
                            onSelect={() => setVhfSpacing(button.setting)}
                            selected={vhfSpacing === button.setting}
                        >
                            {button.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </div>
        </div>
    );
};
