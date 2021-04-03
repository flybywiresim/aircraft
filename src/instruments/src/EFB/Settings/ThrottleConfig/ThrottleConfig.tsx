import React, { useEffect, useState } from 'react';
import { NXDataStore } from '../../../Common/persistence';
import { useSimVar } from '../../../Common/simVars';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import { SelectItem, VerticalSelectGroup } from '../../Components/Form/Select';
import { Toggle } from '../../Components/Form/Toggle';

import BaseThrottleConfig from './BaseThrottleConfig';
import { ThrottleSimvar } from './ThrottleSimVar';

interface Props {
    isShown: boolean,
    onClose: any
}

const ThrottleConfig: React.FC<Props> = (props: Props) => {
    if (!props.isShown) {
        return null;
    }

    const dualAxis: string = NXDataStore.get('dualAxis', '0');
    const [isDualAxis, setDualAxis] = useState(dualAxis);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const [reverserOnAxis1, setReverserOnAxis1] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:1', 'number', 1000);
    const [, setReverserOnAxis2] = useSimVar('L:A32NX_THROTTLE_MAPPING_USE_REVERSE_ON_AXIS:2', 'number', 1000);

    const [, syncToDisk] = useSimVar('K:A32NX.THROTTLE_MAPPING_SAVE_TO_FILE', 'number', 1000);
    const [, syncToThrottle] = useSimVar('K:A32NX.THROTTLE_MAPPING_LOAD_FROM_FILE', 'number', 1000);
    const [, applyLocalVar] = useSimVar('K:A32NX.THROTTLE_MAPPING_LOAD_FROM_LOCAL_VARIABLES', 'number', 1000);

    const mappingsAxisOne: Array<ThrottleSimvar> = [
        new ThrottleSimvar('Reverse', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 1),
        new ThrottleSimvar('RevIdle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 1),
        new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 1),
        new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 1),
        new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 1),
        new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 1),
    ];
    const mappingsAxis2: Array<ThrottleSimvar> = [
        new ThrottleSimvar('Reverse', 'L:A32NX_THROTTLE_MAPPING_REVERSE_', 2),
        new ThrottleSimvar('RevIdle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_', 2),
        new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_', 2),
        new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_', 2),
        new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_', 2),
        new ThrottleSimvar('TOGA', 'L:A32NX_THROTTLE_MAPPING_TOGA_', 2),
    ];
    useEffect(() => {
        if (reverserOnAxis1 === 0 && selectedIndex < 2) {
            setSelectedIndex(2);
        }
    });

    const setReversOnAxis = (reverserOnAxis: number) => {
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

    function isConfigValid() {
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
        return errors;
    }

    const navigationBar = (
        <div className="h-80 flex flex-row mt-auto mb-auto ml-16">
            <VerticalSelectGroup>
                <SelectItem onSelect={() => switchDetent(5)} selected={selectedIndex === 5}>TO/GA</SelectItem>
                <SelectItem onSelect={() => switchDetent(4)} selected={selectedIndex === 4}>FLX</SelectItem>
                <SelectItem onSelect={() => switchDetent(3)} selected={selectedIndex === 3}>CLB</SelectItem>
                <SelectItem onSelect={() => switchDetent(2)} selected={selectedIndex === 2}>Idle</SelectItem>
                <SelectItem
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

    return (
        <div className="flex flex-col pt-4 pb-20 text-center">
            <div className="rounded-xl py-6">

                <div className="flex justify-center bg-gray-800 mt-auto mb-8 p-4 w-100">

                    <span className="text-lg text-gray-300 mr-2">Reverser On Axis</span>
                    <Toggle value={!!reverserOnAxis1} onToggle={(value) => setReversOnAxis(value ? 1 : 0)} />
                    <span>
                        <span className="text-lg text-gray-300 mr-2 ml-2">Dual Axis</span>
                    </span>
                    <Toggle
                        value={!!parseInt(isDualAxis)}
                        onToggle={(value) => {
                            NXDataStore.set('dualAxis', value ? '1' : '0');
                            setDualAxis(value ? '1' : '0');
                        }}
                    />
                </div>

                { parseInt(isDualAxis) === 1 && (
                    <div className="flex flex-row justify-center">

                        <BaseThrottleConfig
                            mappingsAxisOne={mappingsAxisOne}
                            disabled={false}
                            throttleNumber={1}
                            throttleCount={parseInt(isDualAxis) === 0 ? 2 : 1}
                            activeIndex={selectedIndex}
                        />
                        <div className="w-8" />
                        <BaseThrottleConfig
                            mappingsAxisOne={mappingsAxis2}
                            disabled={false}
                            throttleNumber={2}
                            throttleCount={1}
                            activeIndex={selectedIndex}
                        />

                        {navigationBar}

                    </div>
                )}

                { parseInt(isDualAxis) === 0
                    && (
                        <div className="flex flex-row justify-center">
                            <BaseThrottleConfig
                                mappingsAxisOne={mappingsAxisOne}
                                mappingsAxisTwo={mappingsAxis2}
                                disabled={false}
                                throttleNumber={1}
                                throttleCount={2}
                                activeIndex={selectedIndex}
                            />
                            {navigationBar}
                        </div>
                    )}
            </div>

            {isConfigValid().length > 0 && (<div className="text-xl text-red-600">{isConfigValid()[0]}</div>)}

            <div className="bg-gray-800 flex flex-row-reverse mt-12">

                <Button
                    text="Save & Apply"
                    type={BUTTON_TYPE.GREEN}
                    onClick={() => {
                        if (isConfigValid()) {
                            syncToDisk(1);
                            applyLocalVar(1);
                        }
                    }}
                    disabled={!isConfigValid}
                    className={`ml-2 mr-4 ${isConfigValid().length === 0 ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600' : 'opacity-30'}`}
                />
                <Button
                    text="Apply"
                    type={BUTTON_TYPE.BLUE}
                    onClick={() => applyLocalVar(1)}
                    className={`ml-2 ${isConfigValid().length === 0 ? 'bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600' : 'bg-gray-500 opacity-30'}`}
                />
                <Button
                    text="Reset"
                    type={BUTTON_TYPE.BLUE}
                    onClick={() => syncToThrottle(1)}
                    className="ml-2 hover:bg-blue-600 hover:border-blue-600"
                />
                <Button
                    text="Back"
                    type={BUTTON_TYPE.BLUE}
                    onClick={() => props.onClose()}
                    className="ml-4 mr-auto hover:bg-blue-600 hover:border-blue-600"
                />
            </div>
        </div>
    );
};

export default ThrottleConfig;
