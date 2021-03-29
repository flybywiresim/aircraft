import React, { useState } from 'react';
import { NXDataStore, usePersistentProperty } from '../../../Common/persistence';

import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import Input from '../../Components/Form/Input/Input';
import { ProgressBar } from '../../Components/Progress/Progress';

interface Props {
    upperBoundDetentSetter,
    lowerBoundDetentSetter,
    lowerBoundDetentGetter,
    upperBoundDetentGetter,
    detentValue,
    throttleNumber,
    throttlePosition,
    index,
}

const DetentConfig: React.FC<Props> = (props: Props) => {
    const [showWarning, setShowWarning] = useState(false);

    const [deadZone, setDeadZone] = useState(NXDataStore.get(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`, '0.05'));
    const [axisValue, setAxisValue] = usePersistentProperty(`THROTTLE_${props.throttleNumber}DETENT_RAW_${props.index}`);

    const setFromTo = (throttle1Position, settingLower, settingUpper, overrideValue?: string) => {
        const newSetting = overrideValue || throttle1Position;

        setAxisValue(throttle1Position.toFixed(2));
        settingLower.forEach((f) => f(newSetting - parseFloat(deadZone) < -1 ? -1 : newSetting - parseFloat(deadZone)));
        settingUpper.forEach((f) => f(newSetting + parseFloat(deadZone) > 1 ? 1 : newSetting + parseFloat(deadZone)));
    };

    const updateDeadzone = (settingLower, settingUpper, deadZone: number) => {
        settingLower.forEach((f) => f(parseFloat(axisValue) - deadZone < -1 ? -1 : parseFloat(axisValue) - deadZone));
        settingUpper.forEach((f) => f(parseFloat(axisValue) + deadZone > 1 ? 1 : parseFloat(axisValue) + deadZone));
    };

    return (
        <div className="mb-4 w-80 justify-between items-center p-4 flex flex-row">
            <div className="">
                <ProgressBar
                    height="350px"
                    width="30px"
                    isLabelVisible={false}
                    displayBar
                    borderRadius="0px"
                    completedBar={(props.lowerBoundDetentGetter + 1) * 50}
                    completedBar2={(props.upperBoundDetentGetter + 1) * 50}
                    bgcolor="#3b82f6"
                    vertical
                    baseBgColor="rgba(55, 65, 81, var(--tw-bg-opacity))"
                    completed={(props.throttlePosition + 1) / 2 * 100}
                />
            </div>
            <div>
                <Input
                    key={props.index}
                    label="Configure Range"
                    type="number"
                    className="dark-option"
                    value={deadZone}
                    onChange={(deadZone) => {
                        if (parseFloat(deadZone) >= 0.01) {
                            updateDeadzone(props.lowerBoundDetentSetter, props.upperBoundDetentSetter, parseFloat(deadZone));
                            NXDataStore.set(`THROTTLE_${props.throttleNumber}DETENT_${props.index}`, parseFloat(deadZone).toFixed(2));
                            setShowWarning(false);
                            setDeadZone(deadZone);
                        } else {
                            setShowWarning(true);
                        }
                    }}
                />
                <Button
                    className="w-full border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 mt-4"
                    text="Set From Throttle"
                    onClick={() => {
                        setFromTo(props.throttlePosition, props.lowerBoundDetentSetter, props.upperBoundDetentSetter);
                    }}
                    type={BUTTON_TYPE.NONE}
                />

                {showWarning && (
                    <h1 className="mt-4 text-red-600 text-xl">Please enter a valid deadzone (min. 0.1)</h1>
                )}

                {!showWarning && (
                    <h1 className="text-white mt-4 text-xl ">
                        Lower Bound:
                        {' '}
                        {(props.lowerBoundDetentGetter).toFixed(2) }
                        <br />
                        {' '}
                        Upper Bound:
                        {' '}
                        {(props.upperBoundDetentGetter).toFixed(2) }
                    </h1>
                )}
            </div>
        </div>
    );
};
export default DetentConfig;
