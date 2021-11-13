import React, { useEffect, useState } from 'react';
import { usePersistentProperty } from '../../../Common/persistence';

import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
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
    barPosition: string,
    expertMode: boolean,
    initialize: boolean,
    setInitialize,
}

const DetentConfig: React.FC<Props> = (props: Props) => {
    const [showWarning, setShowWarning] = useState(false);

    const [deadZone, setDeadZone] = usePersistentProperty(`THROTTLE_${props.throttleNumber}DETENT_${props.index}_RANGE`, '0.05');

    const [previousMode, setPreviousMode] = useState(props.expertMode);
    const [axisValue, setAxisValue] = usePersistentProperty(`THROTTLE_${props.throttleNumber}AXIS_${props.index}_VALUE`, '0');

    const setFromTo = (throttle1Position, settingLower, settingUpper, deadZone: number, overrideValue?: string) => {
        const newSetting = overrideValue || throttle1Position;

        setAxisValue(newSetting.toFixed(2));
        if (deadZone) {
            settingLower.forEach((f) => f(newSetting - deadZone < -1 ? -1 : newSetting - deadZone));
            settingUpper.forEach((f) => f(newSetting + deadZone > 1 ? 1 : newSetting + deadZone));
        }
    };

    const applyDeadzone = (settingLower, settingUpper, axisValue: number, deadZone: number) => {
        settingLower.forEach((f) => f(axisValue - deadZone < -1 ? -1 : axisValue - deadZone));
        settingUpper.forEach((f) => f(axisValue + deadZone > 1 ? 1 : axisValue + deadZone));
    };

    useEffect(() => {
        // initialize persistent values from previous configurations
        if (!axisValue || props.initialize) {
            const axisValue = (props.lowerBoundDetentGetter + props.upperBoundDetentGetter) / 2;
            const dz = Math.abs((Math.abs(props.upperBoundDetentGetter) - Math.abs(props.lowerBoundDetentGetter))) / 2;
            setAxisValue(axisValue.toFixed(2));
            if (dz > 0) {
                setDeadZone(dz.toFixed(2));
            }
            applyDeadzone(props.lowerBoundDetentSetter, props.upperBoundDetentSetter, axisValue, parseFloat(deadZone));
            props.setInitialize(false);
        }
        setPreviousMode(props.expertMode);
    }, [axisValue, props, deadZone]);

    return (
        <div className="mb-2w-full h-96 justify-between items-center p-2 flex flex-row flex-shrink-0 text-white overflow-hidden">
            {props.barPosition === 'left'
                && (
                    <div className="mr-8 h-full">
                        <ProgressBar
                            height="350px"
                            width="50px"
                            isLabelVisible={false}
                            displayBar
                            borderRadius="0px"
                            completedBarBegin={(props.lowerBoundDetentGetter + 1) * 50}
                            completedBarBeginValue={props.lowerBoundDetentGetter.toFixed(2)}
                            completedBarEnd={(props.upperBoundDetentGetter + 1) * 50}
                            completedBarEndValue={props.upperBoundDetentGetter.toFixed(2)}
                            bgcolor="#3b82f6"
                            vertical
                            baseBgColor="rgba(55, 65, 81, var(--tw-bg-opacity))"
                            completed={(props.throttlePosition + 1) / 2 * 100}
                            completionValue={props.throttlePosition}
                            greenBarsWhenInRange
                        />
                    </div>
                )}

            <div>
                {!props.expertMode
                    && (
                        <div className="flex flex-col w-full">
                            <SimpleInput
                                label="Deadband +/-"
                                className="w-52 mb-4"
                                value={deadZone}
                                labelPosition="col"
                                reverse
                                noLeftMargin
                                onChange={(deadZone) => {
                                    if (parseFloat(deadZone) >= 0.01) {
                                        if (previousMode === props.expertMode) {
                                            applyDeadzone(props.lowerBoundDetentSetter, props.upperBoundDetentSetter, parseFloat(axisValue), parseFloat(deadZone));
                                            setShowWarning(false);
                                            setDeadZone(parseFloat(deadZone).toFixed(2));
                                        }
                                    } else {
                                        setShowWarning(true);
                                    }
                                }}
                            />
                            <Button
                                className="border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600"
                                text="Set From Throttle"
                                onClick={() => {
                                    setFromTo(props.throttlePosition, props.lowerBoundDetentSetter, props.upperBoundDetentSetter, parseFloat(deadZone));
                                }}
                                type={BUTTON_TYPE.NONE}
                            />
                        </div>
                    )}
                {props.expertMode
                    && (
                        <div>
                            <SimpleInput
                                label="Configure End"
                                labelPosition="col"
                                reverse
                                className="dark-option w-36 mr-0"
                                value={!props.expertMode ? deadZone : props.upperBoundDetentGetter.toFixed(2)}
                                noLeftMargin
                                onChange={(deadZone) => {
                                    if (previousMode === props.expertMode && deadZone.length > 1 && !Number.isNaN(Number(deadZone))) {
                                        const dz = Math.abs((Math.abs(props.upperBoundDetentGetter) - Math.abs(props.lowerBoundDetentGetter)));
                                        setAxisValue((dz / 2).toFixed(2));
                                        setDeadZone(dz.toFixed(2));
                                        props.upperBoundDetentSetter.forEach((f) => f(parseFloat(deadZone)));
                                        setShowWarning(false);
                                    }
                                }}
                            />
                            <SimpleInput
                                label={props.expertMode ? 'Configure Start' : 'Configure Range'}
                                className="dark-option mt-2 w-36"
                                labelPosition="col"
                                reverse
                                value={!props.expertMode ? deadZone : props.lowerBoundDetentGetter.toFixed(2)}
                                noLeftMargin
                                onChange={(deadZone) => {
                                    if (previousMode === props.expertMode && deadZone.length > 1 && !Number.isNaN(Number(deadZone))) {
                                        const dz = Math.abs((Math.abs(props.upperBoundDetentGetter) - Math.abs(props.lowerBoundDetentGetter)));
                                        setAxisValue((dz / 2).toFixed(2));
                                        setDeadZone(dz.toFixed(2));
                                        props.lowerBoundDetentSetter.forEach((f) => f(parseFloat(deadZone)));
                                        setShowWarning(false);
                                    }
                                }}
                            />
                        </div>
                    )}
                {showWarning && (
                    <h1 className="mt-4 text-red-600 text-xl">Please enter a valid deadzone (min. 0.1)</h1>
                )}

            </div>
            {props.barPosition === 'right'
                && (
                    <div className="ml-8 h-full">
                        <ProgressBar
                            height="350px"
                            width="50px"
                            isLabelVisible={false}
                            displayBar
                            borderRadius="0px"
                            completedBarBegin={(props.lowerBoundDetentGetter + 1) * 50}
                            completedBarBeginValue={props.lowerBoundDetentGetter.toFixed(2)}
                            completedBarEnd={(props.upperBoundDetentGetter + 1) * 50}
                            completedBarEndValue={props.upperBoundDetentGetter.toFixed(2)}
                            bgcolor="#3b82f6"
                            vertical
                            baseBgColor="rgba(55, 65, 81, var(--tw-bg-opacity))"
                            completed={(props.throttlePosition + 1) / 2 * 100}
                            completionValue={props.throttlePosition}
                            greenBarsWhenInRange
                        />
                    </div>
                )}
        </div>
    );
};
export default DetentConfig;
