import { IconEdit } from '@tabler/icons';
import React, { useState } from 'react';
import { useSimVar } from '../../../Common/simVars';
import DetentConfig from './DetentConfig';
import { ThrottleSimvar } from './ThrottleSimVar';

interface Props {
    throttleNumber: number,
    throttleCount: number,
    mappingsAxisOne: ThrottleSimvar[],
    mappingsAxisTwo?: ThrottleSimvar[]
    activeIndex: number,
    disabled: boolean,
}

const BaseThrottleConfig: React.FC<Props> = (props: Props) => {
    const [throttlePosition] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${props.throttleNumber}`, 'number', 30);
    const [expertMode, setExpertMode] = useState(false);

    const currentDetent = (
        <DetentConfig
            key={props.activeIndex}
            index={props.activeIndex}
            barPosition={props.throttleNumber === 1 ? 'right' : 'left'}
            throttlePosition={throttlePosition}
            upperBoundDetentSetter={props.mappingsAxisTwo
                ? [props.mappingsAxisOne[props.activeIndex].getHiSetter(), props.mappingsAxisTwo[props.activeIndex].getHiSetter()]
                : [props.mappingsAxisOne[props.activeIndex].getHiSetter()]}
            lowerBoundDetentSetter={props.mappingsAxisTwo
                ? [props.mappingsAxisOne[props.activeIndex].getLowSetter(), props.mappingsAxisTwo[props.activeIndex].getLowSetter()]
                : [props.mappingsAxisOne[props.activeIndex].getLowSetter()]}
            lowerBoundDetentGetter={props.mappingsAxisOne[props.activeIndex].getLowGetter()}
            upperBoundDetentGetter={props.mappingsAxisOne[props.activeIndex].getHiGetter()}
            detentValue={props.mappingsAxisOne[props.activeIndex].getLowGetter()}
            throttleNumber={props.throttleNumber}
            expertMode={expertMode}
        />
    );

    return (
        <div className="w-50">
            <h1 className="text-white mb-4">
                Axis
                {' '}
                {props.throttleCount === 1 ? props.throttleNumber : '1 & 2'}
                {' '}
            </h1>
            <div className="bg-navy-lighter px-4 pt-5 mt-4 rounded-2xl">
                <div className="flex flew-row justify-center">
                    <h1 className="text-white mb-8 text-xl ">
                        Current Value:
                        {' '}
                        {throttlePosition.toFixed(2)}
                        {' '}

                    </h1>
                    <div className="ml-2 text-blue-500"><IconEdit onMouseDown={() => setExpertMode(!expertMode)} size="1.5rem" stroke="1.5" /></div>
                </div>

                <div className="flex flex-row">
                    <div className="justify-between items-center flex flex-col">
                        {currentDetent}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BaseThrottleConfig;
