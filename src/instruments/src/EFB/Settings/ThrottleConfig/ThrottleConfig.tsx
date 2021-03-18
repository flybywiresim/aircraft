import { IconArrowLeft, IconArrowRight } from '@tabler/icons';
import React, { useState } from 'react';
import { NXDataStore, usePersistentProperty } from '../../../Common/persistence';
import { useSimVar } from '../../../Common/simVars';
import Bar from '../../Components/Bar/Bar';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import { SelectGroup, SelectItem, VerticalSelectGroup } from '../../Components/Form/Select';
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

    const dualAxis = NXDataStore.get('dualAxis', '0');
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
        console.log('click');
        if (index >= 0 && index <= 5) {
            setSelectedIndex(index);
        }
    };

    return (
        <div className="flex flex-row justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className=" rounded-xl px-6 py-4 shadow-lg mt-4 mb-4">
                <div className=" flex flex-row w-full top-1/2">
                    <div className="mb-4 flex flex-col right-0 w-1/2" />
                </div>
                <span />

                { parseInt(dualAxis) !== 0

                    && (

                        <div className="flex flex-row justify-center">

                            <div className="mt-auto mr-6 mb-auto text-3xl">
                                {/*    <IconArrowLeft
                                    size="4rem"
                                    onClick={() => switchDetent(selectedIndex - 1)}
                                    className={`mt-auto mb-auto w-42 ${selectedIndex === 0 ? 'text-gray-600' : 'text-white hover:text-blue'}`}
                                />
 */}
                            </div>

                            <BaseThrottleConfig throttleNumber={1} throttleCount={1} activeIndex={selectedIndex} />

                            <div className="w-1/12" />
                            <BaseThrottleConfig throttleNumber={2} throttleCount={1} activeIndex={selectedIndex} />

                            <div className="h-100 ml-52 flex flex-row-reverse">

                                <VerticalSelectGroup>
                                    <SelectItem classNames="divide-y divide-grey-500 mb-4" onSelect={() => switchDetent(0)} selected={selectedIndex === 0}>Reverse</SelectItem>
                                    <SelectItem classNames="divide-y divide-grey-500 mb-4" onSelect={() => switchDetent(1)} selected={selectedIndex === 1}>Rev. Idle</SelectItem>
                                    <SelectItem classNames="divide-y divide-grey-500 mb-4" onSelect={() => switchDetent(2)} selected={selectedIndex === 2}>Idle</SelectItem>
                                    <SelectItem classNames="divide-y divide-grey-500 mb-4" onSelect={() => switchDetent(3)} selected={selectedIndex === 3}>CLB</SelectItem>
                                    <SelectItem classNames="divide-y divide-grey-500 mb-4" onSelect={() => switchDetent(4)} selected={selectedIndex === 4}>FLX</SelectItem>
                                    <SelectItem classNames="divide-y divide-grey-500 mb-4" onSelect={() => switchDetent(5)} selected={selectedIndex === 5}>TO/GA</SelectItem>
                                </VerticalSelectGroup>
                                {/*        <IconArrowRight
                                    size="4rem"
                                    onClick={() => switchDetent(selectedIndex + 1)}
                                    className={`mt-auto mb-auto w-42 ${selectedIndex === 5 ? 'text-gray-600' : 'text-white hover:text-blue'}`}
                                />
 */}
                            </div>

                        </div>
                    )}

                { parseInt(dualAxis) === 0
                    && (
                        <div className="flex flex-row justify-center">

                            <BaseThrottleConfig throttleNumber={1} throttleCount={2} activeIndex={selectedIndex} />
                        </div>
                    )}
                <div className="flex flex-row  " />

            </div>
            <div className="bg-gray-800 flex flex-row-reverse">

                <Button
                    text="Save"
                    type={BUTTON_TYPE.GREEN}
                    onClick={() => syncToDisk(1)}
                    className="ml-2 mr-2"
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
                <div className="flex left-0 mt-auto mb-auto">

                    <span className="text-lg text-gray-300 mr-2">Reverser On Axis</span>
                    <Toggle value={!!reverserOnAxis1} onToggle={(value) => setReversOnAxis(value ? 1 : 0)} />
                    <div className="flex flex-row-reverse divide-y divide-gray-700" />
                    <span>
                        <span className="text-lg text-gray-300 mr-2 ml-2">Dual Axis</span>
                    </span>
                    <Toggle value={!!parseInt(dualAxis)} onToggle={(value) => NXDataStore.set('dualAxis', value ? '1' : '0')} />
                </div>
            </div>
        </div>
    );
};

export default ThrottleConfig;
