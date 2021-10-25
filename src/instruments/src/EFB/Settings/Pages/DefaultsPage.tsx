import React, { useState } from 'react';
import { usePersistentProperty } from '@instruments/common/persistence';

import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';

export const DefaultsPage = () => {
    const [thrustReductionHeight, setThrustReductionHeight] = usePersistentProperty('CONFIG_THR_RED_ALT', '1500');
    const [thrustReductionHeightSetting, setThrustReductionHeightSetting] = useState(thrustReductionHeight);
    const [accelerationHeight, setAccelerationHeight] = usePersistentProperty('CONFIG_ACCEL_ALT', '1500');
    const [accelerationHeightSetting, setAccelerationHeightSetting] = useState(accelerationHeight);
    const [accelerationOutHeight, setAccelerationOutHeight] = usePersistentProperty('CONFIG_ENG_OUT_ACCEL_ALT', '1500');
    const [accelerationOutHeightSetting, setAccelerationOutHeightSetting] = useState(accelerationOutHeight);

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

    return (
        <div className="bg-navy-lighter rounded-xl px-6 divide-y divide-gray-700 flex flex-col">

            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Thrust Reduction Height (ft)</span>
                <div className="flex flex-row">
                    <SimpleInput
                        className="w-30 ml-1.5 px-5 py-1.5 text-lg text-gray-300 rounded-lg bg-navy-light
                            border-2 border-navy-light focus-within:outline-none focus-within:border-teal-light-contrast text-center"
                        placeholder={thrustReductionHeight}
                        noLabel
                        value={thrustReductionHeightSetting}
                        min={400}
                        max={5000}
                        onChange={(event) => handleSetThrustReductionAlt(event)}
                    />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Acceleration Height (ft)</span>
                <div className="flex flex-row">
                    <SimpleInput
                        className="w-30 ml-1.5 px-5 py-1.5 text-lg text-gray-300 rounded-lg bg-navy-light
                            border-2 border-navy-light focus-within:outline-none focus-within:border-teal-light-contrast text-center"
                        placeholder={accelerationHeight}
                        noLabel
                        value={accelerationHeightSetting}
                        min={400}
                        max={10000}
                        onChange={(event) => handleSetAccelerationAlt(event)}
                    />
                </div>
            </div>
            <div className="py-4 flex flex-row justify-between items-center">
                <span className="text-lg text-gray-300">Engine-Out Acceleration Height (ft)</span>
                <div className="flex flex-row">
                    <SimpleInput
                        className="w-30 ml-1.5 px-5 py-1.5 text-lg text-gray-300 rounded-lg bg-navy-light
                            border-2 border-navy-light focus-within:outline-none focus-within:border-teal-light-contrast text-center"
                        placeholder={accelerationOutHeight}
                        noLabel
                        value={accelerationOutHeightSetting}
                        min={400}
                        max={10000}
                        onChange={(event) => handleSetAccelerationOutAlt(event)}
                    />
                </div>
            </div>
        </div>
    );
};
