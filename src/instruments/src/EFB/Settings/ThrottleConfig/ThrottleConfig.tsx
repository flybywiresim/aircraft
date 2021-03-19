import React, { useState } from 'react';
import { NXDataStore } from '../../../Common/persistence';
import { useSimVar } from '../../../Common/simVars';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import { SelectItem, VerticalSelectGroup } from '../../Components/Form/Select';
import { Toggle } from '../../Components/Form/Toggle';

import BaseThrottleConfig from './BaseThrottleConfig';

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

    const setReversOnAxis = (reverserOnAxis: number) => {
        setReverserOnAxis1(reverserOnAxis);
        setReverserOnAxis2(reverserOnAxis);
    };

    const switchDetent = (index: number) => {
        if (index >= 0 && index <= 5) {
            setSelectedIndex(index);
        }
    };

    return (
        <div className="flex flex-row justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className=" rounded-xl py-6">
                <div className=" flex flex-row w-full top-1/2">
                    <div className="mb-4 flex flex-col right-0 w-1/2" />
                </div>
                <span />
                <div className="flex justify-center bg-gray-800 mt-auto mb-8 p-4 w-100">

                    <span className="text-lg text-gray-300 mr-2">Reverser On Axis</span>
                    <Toggle value={!!reverserOnAxis1} onToggle={(value) => setReversOnAxis(value ? 1 : 0)} />
                    <div className="flex flex-row-reverse divide-y ml-4 divide-gray-700" />
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

                        <BaseThrottleConfig disabled={false} throttleNumber={1} throttleCount={parseInt(isDualAxis) === 0 ? 2 : 1} activeIndex={selectedIndex} />
                        <div className="w-8" />
                        <BaseThrottleConfig disabled={false} throttleNumber={2} throttleCount={1} activeIndex={selectedIndex} />

                        <div className="h-100 flex flex-row mt-8 ml-16">
                            <VerticalSelectGroup>
                                <SelectItem classNames="mb-4" onSelect={() => switchDetent(0)} selected={selectedIndex === 0}>Reverse</SelectItem>
                                <SelectItem classNames="mb-4" onSelect={() => switchDetent(1)} selected={selectedIndex === 1}>Rev. Idle</SelectItem>
                                <SelectItem classNames="mb-4" onSelect={() => switchDetent(2)} selected={selectedIndex === 2}>Idle</SelectItem>
                                <SelectItem classNames="mb-4" onSelect={() => switchDetent(3)} selected={selectedIndex === 3}>CLB</SelectItem>
                                <SelectItem classNames="mb-4" onSelect={() => switchDetent(4)} selected={selectedIndex === 4}>FLX</SelectItem>
                                <SelectItem classNames="mb-4" onSelect={() => switchDetent(5)} selected={selectedIndex === 5}>TO/GA</SelectItem>
                            </VerticalSelectGroup>
                        </div>

                    </div>
                )}

                { parseInt(isDualAxis) === 0
                    && (
                        <div className="flex flex-row justify-center">
                            <BaseThrottleConfig disabled={false} throttleNumber={1} throttleCount={2} activeIndex={selectedIndex} />
                            <div className="h-100 flex flex-row mt-8 ml-16">
                                <VerticalSelectGroup>
                                    <SelectItem classNames="mb-4" onSelect={() => switchDetent(0)} selected={selectedIndex === 0}>Reverse</SelectItem>
                                    <SelectItem classNames="mb-4" onSelect={() => switchDetent(1)} selected={selectedIndex === 1}>Rev. Idle</SelectItem>
                                    <SelectItem classNames="mb-4" onSelect={() => switchDetent(2)} selected={selectedIndex === 2}>Idle</SelectItem>
                                    <SelectItem classNames="mb-4" onSelect={() => switchDetent(3)} selected={selectedIndex === 3}>CLB</SelectItem>
                                    <SelectItem classNames="mb-4" onSelect={() => switchDetent(4)} selected={selectedIndex === 4}>FLX</SelectItem>
                                    <SelectItem classNames="mb-4" onSelect={() => switchDetent(5)} selected={selectedIndex === 5}>TO/GA</SelectItem>
                                </VerticalSelectGroup>
                            </div>
                        </div>
                    )}
                <div className="flex flex-row  " />

            </div>

            <div className="bg-gray-800 flex flex-row-reverse mt-12">

                <Button
                    text="Save"
                    type={BUTTON_TYPE.GREEN}
                    onClick={() => {
                        syncToDisk(1);
                        applyLocalVar(1);
                    }}
                    className="ml-2 mr-4"
                />
                <Button
                    text="Apply"
                    type={BUTTON_TYPE.BLUE}
                    onClick={() => applyLocalVar(1)}
                    className="ml-2"
                />
                <Button
                    text="Reset"
                    type={BUTTON_TYPE.BLUE}
                    onClick={() => syncToThrottle(1)}
                    className="ml-2"
                />
                <Button
                    text="Back"
                    type={BUTTON_TYPE.BLUE}
                    onClick={() => props.onClose()}
                    className="ml-4 mr-auto"
                />
            </div>
        </div>
    );
};

export default ThrottleConfig;
