import React, { useEffect, useState } from 'react';

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

    const [deadZone, setDeadZone] = useState(Math.abs(props.upperBoundDetentGetter - props.lowerBoundDetentGetter) / 2);

    const [previousMode, setPreviousMode] = useState(props.expertMode);

    const setFromTo = (throttle1Position, settingLower, settingUpper, deadZone: number, overrideValue?: string) => {
        const newSetting = overrideValue || throttle1Position;

        settingLower.forEach((f) => f(newSetting - deadZone < -1 ? -1 : newSetting - deadZone));
        settingUpper.forEach((f) => f(newSetting + deadZone > 1 ? 1 : newSetting + deadZone));
    };

    useEffect(() => {
        setPreviousMode(props.expertMode);
    }, [props.expertMode]);

    return (
        <div className="flex overflow-hidden flex-row flex-shrink-0 justify-between items-center p-2 h-96 text-white mb-2w-full">
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
                                className="mb-4 w-52"
                                value={deadZone.toFixed(2)}
                                labelPosition="col"
                                reverse
                                noLeftMargin
                                onChange={(deadZone) => {
                                    if (parseFloat(deadZone) >= 0.01) {
                                        if (previousMode === props.expertMode) {
                                            setShowWarning(false);
                                            setDeadZone(parseFloat(deadZone));
                                        }
                                    } else {
                                        setShowWarning(true);
                                    }
                                }}
                            />
                            <Button
                                className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                                text="Set From Throttle"
                                onClick={() => {
                                    setFromTo(props.throttlePosition, props.lowerBoundDetentSetter, props.upperBoundDetentSetter, deadZone);
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
                                className="mr-0 w-36 dark-option"
                                value={!props.expertMode ? deadZone : props.upperBoundDetentGetter.toFixed(2)}
                                noLeftMargin
                                onChange={(deadZone) => {
                                    if (previousMode === props.expertMode && deadZone.length > 1 && !Number.isNaN(Number(deadZone))) {
                                        props.upperBoundDetentSetter.forEach((f) => f(parseFloat(deadZone)));
                                        setShowWarning(false);
                                    }
                                }}
                            />
                            <SimpleInput
                                label={props.expertMode ? 'Configure Start' : 'Configure Range'}
                                className="mt-2 w-36 dark-option"
                                labelPosition="col"
                                reverse
                                value={!props.expertMode ? deadZone : props.lowerBoundDetentGetter.toFixed(2)}
                                noLeftMargin
                                onChange={(deadZone) => {
                                    if (previousMode === props.expertMode && deadZone.length > 1 && !Number.isNaN(Number(deadZone))) {
                                        props.lowerBoundDetentSetter.forEach((f) => f(parseFloat(deadZone)));
                                        setShowWarning(false);
                                    }
                                }}
                            />
                        </div>
                    )}

                <h2 style={{ visibility: showWarning ? 'visible' : 'hidden' }} className="mt-4  w-48 h-12 text-xl text-red-600">
                    Please enter a
                    valid deadzone (&gt; 0.05)
                </h2>

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
