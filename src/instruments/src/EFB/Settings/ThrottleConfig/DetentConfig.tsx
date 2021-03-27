import React, { useEffect, useState } from 'react';

import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import Input from '../../Components/Form/Input/Input';

interface Props {
    upperBoundDetentSetter,
    lowerBoundDetentSetter,
    detentValue: number,
    throttleNumber,
    throttlePosition,
    text,
    disabled,
}

const DetentConfig: React.FC<Props> = (props: Props) => {
    const [currentValue, setCurrentValue] = useState(0);

    useEffect(() => {
        setCurrentValue(props.detentValue);
    });

    const setFromTo = (throttle1Position, settingLower, settingUpper, overrideValue?: string) => {
        const newSetting = overrideValue || throttle1Position;
        settingLower.forEach((f) => f(newSetting < -0.95 ? -1 : newSetting - 0.05));
        settingUpper.forEach((f) => f(newSetting > 0.95 ? 1 : +newSetting + 0.05));
    };

    return (
        <div className="mb-4 w-56 justify-between items-center mr-4 p-4">
            <Button
                className="w-full border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 mr-4"
                text="Set From Throttle"
                onClick={() => {
                    setFromTo(props.throttlePosition, props.lowerBoundDetentSetter, props.upperBoundDetentSetter);
                }}
                type={BUTTON_TYPE.NONE}
                disabled={props.disabled}
            />
        </div>
    );
};

export default DetentConfig;
