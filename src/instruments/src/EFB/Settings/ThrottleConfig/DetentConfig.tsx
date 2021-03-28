import React, { useState } from 'react';
import { NXDataStore } from '../../../Common/persistence';

import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import Input from '../../Components/Form/Input/Input';

interface Props {
    upperBoundDetentSetter,
    lowerBoundDetentSetter,
    lowerBoundDetentGetter,
    upperBoundDetentGetter,
    detentValue: number,
    throttleNumber,
    throttlePosition,
    index,
}

const DetentConfig: React.FC<Props> = (props: Props) => {
    const [showWarning, setShowWarning] = useState(false);

    const deadZone = NXDataStore.get(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`, '0.05');

    const setFromTo = (throttle1Position, settingLower, settingUpper, overrideValue?: string) => {
        const newSetting = overrideValue || throttle1Position;

        settingLower.forEach((f) => f(newSetting - parseFloat(deadZone) < -1 ? -1 : newSetting - parseFloat(deadZone)));
        settingUpper.forEach((f) => f(newSetting + parseFloat(deadZone) > 1 ? 1 : newSetting + parseFloat(deadZone)));
    };

    return (
        <div className="mb-4 w-56 justify-between items-center mr-4 p-4">
            <Input
                key={props.index}
                label="Configure Range"
                type="number"
                className="dark-option mt-4"
                value={deadZone}
                onChange={(from) => {
                    if (parseFloat(from) >= 0.01) {
                        NXDataStore.set(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`, parseFloat(from).toFixed(2));
                        setShowWarning(false);
                    } else {
                        NXDataStore.set(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`, parseFloat('0.05').toFixed(2));
                        setShowWarning(true);
                    }
                }}
            />
            <Button
                className="w-full border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 mr-4"
                text="Set From Throttle"
                onClick={() => {
                    setFromTo(props.throttlePosition, props.lowerBoundDetentSetter, props.upperBoundDetentSetter);
                }}
                type={BUTTON_TYPE.NONE}
            />

            {showWarning && (
                <h1 className="mt-4 text-red-600 text-xl">Please enter a valid deadzone (0.01 - 0.05)</h1>
            )}

            <h1 className="text-white mt-4 text-xl ">
                Lower Bound:
                {' '}
                {(props.lowerBoundDetentGetter).toFixed(2) }
                {' '}
                Upper Bound:
                {' '}
                {(props.upperBoundDetentGetter).toFixed(2) }
            </h1>

        </div>
    );
};
export default DetentConfig;
