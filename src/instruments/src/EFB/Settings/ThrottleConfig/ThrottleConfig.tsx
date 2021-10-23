import React, { useEffect, useState } from 'react';
import { Toggle } from '../../Components/Form/Toggle';
import { usePersistentProperty } from '../../../Common/persistence';
import { useSimVar } from '../../../Common/simVars';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import { SelectItem, VerticalSelectGroup } from '../../Components/Form/Select';

import BaseThrottleConfig from './BaseThrottleConfig';
import { ThrottleSimvar } from './ThrottleSimVar';

interface Props {
    isShown: boolean,
    onClose: any
}

const ThrottleConfig: React.FC<Props> = (props: Props) => {
    const [isDualAxis, setDualAxis] = usePersistentProperty('THROTTLE_DUAL_AXIS', '1');

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [validConfig, setValidConfig] = useState(true);
    const [validationErrors, setValidationErrors] = useState<string>();

    const [reverserOnAxis1, setReverserOnAxis1] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:1', 'number', 1000);
    const [, setReverserOnAxis2] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:2', 'number', 1000);

    const [, syncToDisk] = useSimVar('K:A32NX.THROTTLE_MAPPING_SAVE_TO_FILE', 'number', 1000);
    const [, defaultsToThrottle] = useSimVar('K:A32NX.THROTTLE_MAPPING_SET_DEFAULTS', 'number', 100);
    const [, syncToThrottle] = useSimVar('K:A32NX.THROTTLE_MAPPING_LOAD_FROM_FILE', 'number', 100);
    const [, applyLocalVar] = useSimVar('K:A32NX.THROTTLE_MAPPING_LOAD_FROM_LOCAL_VARIABLES', 'number', 1000);

    const mappingsAxisOne: Array<ThrottleSimvar> = [
        new ThrottleSimvar('Reverse Full', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 1),
        new ThrottleSimvar('Reverse Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 1),
        new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 1),
        new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 1),
        new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 1),
        new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 1),
    ];
    const mappingsAxisTwo: Array<ThrottleSimvar> = [
        new ThrottleSimvar('Reverse Full', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 2),
        new ThrottleSimvar('Reverse Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 2),
        new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 2),
        new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 2),
        new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 2),
        new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 2),
    ];

    useEffect(() => {
        if (reverserOnAxis1 === 0 && selectedIndex < 2) {
            setSelectedIndex(2);
        }
    }, [reverserOnAxis1, selectedIndex]);

    useEffect(() => {
        const errors: string[] = [];
        for (let index = reverserOnAxis1 ? 0 : 2; index < mappingsAxisOne.length; index++) {
            const element = mappingsAxisOne[index];
            for (let nextIndex = index + 1; nextIndex < mappingsAxisOne.length; nextIndex++) {
                const nextElement = mappingsAxisOne[nextIndex];
                if (element.getHiGetter() >= nextElement.getLowGetter() || element.getLowGetter() >= nextElement.getHiGetter()) {
                    errors.push(`${element.readableName} (${element.getLowGetter().toFixed(2)}) overlaps with ${nextElement.readableName} (${nextElement.getLowGetter().toFixed(2)})`);
                }
            }
        }
        for (let index = reverserOnAxis1 ? 0 : 2; index < mappingsAxisTwo.length; index++) {
            const element = mappingsAxisTwo[index];
            for (let nextIndex = index + 1; nextIndex < mappingsAxisTwo.length; nextIndex++) {
                const nextElement = mappingsAxisTwo[nextIndex];
                if (element.getHiGetter() >= nextElement.getLowGetter() || element.getLowGetter() >= nextElement.getHiGetter()) {
                    errors.push(`${element.readableName} (${element.getLowGetter().toFixed(2)}) overlaps with ${nextElement.readableName} (${nextElement.getLowGetter().toFixed(2)})`);
                }
            }
        }
        setValidationErrors(errors[0]);
        setValidConfig(errors.length === 0);
    }, [mappingsAxisOne, mappingsAxisTwo]);

    const setReversersOnAxis = (reverserOnAxis: number) => {
        setReverserOnAxis1(reverserOnAxis);
        setReverserOnAxis2(reverserOnAxis);
        if (reverserOnAxis === 0 && selectedIndex < 2) {
            setSelectedIndex(2);
        }
    };

    const switchDetent = (index: number) => {
        if (index >= 0 && index <= 5) {
            setSelectedIndex(index);
        }
    };

    const NavigationBar = () => (
        <div className="flex flex-row h-80">
            <VerticalSelectGroup>
                <SelectItem enabled onSelect={() => switchDetent(5)} selected={selectedIndex === 5}>TO/GA</SelectItem>
                <SelectItem enabled onSelect={() => switchDetent(4)} selected={selectedIndex === 4}>FLX</SelectItem>
                <SelectItem enabled onSelect={() => switchDetent(3)} selected={selectedIndex === 3}>CLB</SelectItem>
                <SelectItem enabled onSelect={() => switchDetent(2)} selected={selectedIndex === 2}>Idle</SelectItem>
                <SelectItem
                    enabled
                    classNames={`${reverserOnAxis1 ? '' : 'opacity-30'}`}
                    onSelect={() => {
                        if (reverserOnAxis1) {
                            switchDetent(1);
                        }
                    }}
                    selected={selectedIndex === 1}
                >
                    Reverse Idle
                </SelectItem>
                <SelectItem
                    enabled
                    classNames={`${reverserOnAxis1 ? '' : 'opacity-30'}`}
                    onSelect={() => {
                        if (reverserOnAxis1) {
                            switchDetent(0);
                        }
                    }}
                    selected={selectedIndex === 0}
                >
                    Reverse Full
                </SelectItem>
            </VerticalSelectGroup>
        </div>
    );

    if (props.isShown) {
        return (
            <div className="flex flex-col text-center">
                <div className="py-6 rounded-xl">

                    <div className="flex flex-row justify-center p-4 mt-auto mb-8 space-x-16 w-full rounded-lg border-2 border-theme-accent">
                        <div className="flex flex-row space-x-4">
                            <div>Reverser On Axis</div>
                            <Toggle value={!!reverserOnAxis1} onToggle={(value) => setReversersOnAxis(value ? 1 : 0)} />
                        </div>
                        <div className="flex flex-row space-x-4">
                            <div>Independent Axis</div>
                            <Toggle
                                value={!!parseInt(isDualAxis)}
                                onToggle={(value) => {
                                    setDualAxis(value ? '1' : '0');
                                }}
                            />
                        </div>
                    </div>

                    {parseInt(isDualAxis) === 1 && (
                        <div className="flex flex-row justify-center rounded-xl">
                            <div className="ml-4" />

                            <BaseThrottleConfig
                                mappingsAxisOne={mappingsAxisOne}
                                disabled={false}
                                throttleNumber={1}
                                throttleCount={parseInt(isDualAxis) === 0 ? 2 : 1}
                                activeIndex={selectedIndex}
                            />
                            <div className="mt-auto mr-8 mb-auto ml-8">
                                <NavigationBar />
                            </div>
                            <BaseThrottleConfig
                                mappingsAxisOne={mappingsAxisTwo}
                                disabled={false}
                                throttleNumber={2}
                                throttleCount={1}
                                activeIndex={selectedIndex}
                            />
                            <div className="mr-4" />
                        </div>
                    )}

                    {parseInt(isDualAxis) === 0
            && (
                <div className="flex flex-row justify-center ml-4 rounded-xl">
                    <BaseThrottleConfig
                        mappingsAxisOne={mappingsAxisOne}
                        mappingsAxisTwo={mappingsAxisTwo}
                        disabled={false}
                        throttleNumber={1}
                        throttleCount={2}
                        activeIndex={selectedIndex}
                    />
                    <div className="mt-auto mb-auto ml-8">
                        <NavigationBar />
                    </div>
                </div>
            )}
                </div>
                <h1 className="text-red-600">{validConfig ? ' ' : validationErrors}</h1>

                <div className="flex flex-row justify-between p-4 mt-40 mb-2 w-full rounded-lg border-2 border-theme-accent">
                    <div>
                        <Button
                            text="Back"
                            type={BUTTON_TYPE.BLUE}
                            onClick={() => props.onClose()}
                            className="hover:bg-blue-600 hover:border-blue-600"
                        />
                    </div>
                    <div className="flex flex-row space-x-3">
                        <Button
                            text="Reset to Defaults"
                            type={BUTTON_TYPE.BLUE}
                            onClick={() => {
                                defaultsToThrottle(1);
                            }}
                            className="hover:bg-blue-600 hover:border-blue-600"
                        />
                        <Button
                            text="Load from File"
                            type={BUTTON_TYPE.BLUE}
                            onClick={() => {
                                syncToThrottle(1);
                            }}
                            className="hover:bg-blue-600 hover:border-blue-600"
                        />
                        <Button
                            text="Apply"
                            type={validConfig ? BUTTON_TYPE.BLUE : BUTTON_TYPE.NONE}
                            onClick={() => applyLocalVar(1)}
                            className={`${validConfig ? 'hover:bg-blue-600 hover:border-blue-600' : 'bg-gray-500 border-gray-500 opacity-30'}`}
                        />
                        <Button
                            text="Save and Apply"
                            type={BUTTON_TYPE.GREEN}
                            onClick={() => {
                                if (validConfig) {
                                    syncToDisk(1);
                                    applyLocalVar(1);
                                }
                            }}
                            disabled={!validConfig}
                            className={`${validConfig ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600' : 'opacity-30'}`}
                        />
                    </div>
                </div>
            </div>
        );
    }
    return <></>;
};

export default ThrottleConfig;
