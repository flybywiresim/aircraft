import React from 'react';

import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import Input from '../../Components/Form/Input/Input';

interface Props {
    detentSetting,
    detentValue: number,
    throttleNumber,
    throttlePosition,
    text,
    disabled,
}

const DetentConfig: React.FC<Props> = (props: Props) => {
    const setFromTo = (throttle1Position, setting, overrideValue?: string) => {
        const newSetting = overrideValue || throttle1Position;
        setting.forEach((f) => f(newSetting));
    };

    return (
        <div className="mb-4 w-56 justify-between items-center mr-4 p-4">
            <h1 className="text-xl text-white mb-2">{props.text}</h1>
            <Button
                className="w-full border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 mr-4"
                text="Set From Throttle"
                onClick={() => {
                    setFromTo(props.throttlePosition, props.detentSetting);
                }}
                type={BUTTON_TYPE.NONE}
                disabled={props.disabled}
            />
            <h1 className="text-xl text-white mt-4 mb-4">or</h1>
            <Input
                label="Enter value"
                type="number"
                className="dark-option mb-4"
                value={props.detentValue.toFixed(2)}
                disabled={props.disabled}
                onChange={(from) => setFromTo(props.detentValue, props.detentSetting, from)}
            />
        </div>
    );
};

export default DetentConfig;
