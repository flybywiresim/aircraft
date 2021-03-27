import React from 'react';
import { useSimVar } from '../../../Common/simVars';
import DetentConfig from './DetentConfig';

interface Props {
    throttleNumber: number,
    throttleCount: number,
    activeIndex: number,
    disabled: boolean
}

class ThrottleSimvar {
    readableName: string;

    technicalName: string;

    hiSetter: Array<any>;

    hiGetter: Array<number>;

    lowSetter: Array<any>;

    lowGetter: Array<number>;

    constructor(readableName: string, technicalName: string) {
        this.readableName = readableName;
        this.technicalName = technicalName;
        this.hiSetter = [];
        this.hiGetter = [];
        this.lowGetter = [];
        this.lowSetter = [];
    }
}

const BaseThrottleConfig: React.FC<Props> = (props: Props) => {
    const mappings: Array<ThrottleSimvar> = [
        new ThrottleSimvar('Reverse', 'L:A32NX_THROTTLE_MAPPING_REVERSE_'),
        new ThrottleSimvar('Rev. Idle', 'L:A32NX_THROTTLE_MAPPING_REVERSE_IDLE_'),
        new ThrottleSimvar('Idle', 'L:A32NX_THROTTLE_MAPPING_IDLE_'),
        new ThrottleSimvar('Climb', 'L:A32NX_THROTTLE_MAPPING_CLIMB_'),
        new ThrottleSimvar('Flex', 'L:A32NX_THROTTLE_MAPPING_FLEXMCT_'),
        new ThrottleSimvar('TO/GA', 'L:A32NX_THROTTLE_MAPPING_TOGA_'),
    ];

    const [throttlePosition] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${props.throttleNumber}`, 'number', 50);

    for (const mapped of mappings) {
        for (let index = 1; index <= props.throttleCount; index++) {
            const throttleNumber: number = props.throttleCount > 1 ? index : props.throttleNumber;

            mapped.hiGetter.push(useSimVar(`${mapped.technicalName}HIGH:${throttleNumber}`, 'number', 100)[0]);
            mapped.hiSetter.push(useSimVar(`${mapped.technicalName}HIGH:${throttleNumber}`, 'number', 100)[1]);

            mapped.lowGetter.push(useSimVar(`${mapped.technicalName}LOW:${throttleNumber}`, 'number', 100)[0]);
            mapped.lowSetter.push(useSimVar(`${mapped.technicalName}LOW:${throttleNumber}`, 'number', 100)[1]);
        }
    }

    const currentDetent = (
        <div className={`flex flex-row ${props.disabled ? 'opacity-30' : ''}`}>
            <DetentConfig
                throttlePosition={throttlePosition}
                text={`${mappings[props.activeIndex].readableName}`}
                upperBoundDetentSetter={mappings[props.activeIndex].hiSetter}
                lowerBoundDetentSetter={mappings[props.activeIndex].lowSetter}
                detentValue={mappings[props.activeIndex].lowGetter[props.throttleCount - 1]}
                throttleNumber={props.throttleNumber}
                disabled={props.disabled}
            />
        </div>
    );

    return (
        <div>
            <h1 className="text-white mb-4 text-3xl ">
                Axis
                {' '}
                {props.throttleNumber}
                {' '}
            </h1>
            <div className="bg-gray-800 rou px-4 pt-5 pb-4 sm:p-6 sm:pb-4 mt-4 mb-4 rounded-lg">
                <h1 className="text-white mb-8 text-xl ">
                    Current Value:
                    {' '}
                    {throttlePosition.toFixed(2)}
                </h1>

                <div className="flex flex-row">
                    <div className="justify-between items-center flex flex-col ">
                        {currentDetent}
                    </div>
                </div>
                <h1 className="text-white mb-8 text-xl ">
                    Stored Value:
                    {' '}
                    {mappings[props.activeIndex].lowGetter[props.throttleCount - 1] > 0.95
                        ? mappings[props.activeIndex].lowGetter[props.throttleCount - 1]
                        : (mappings[props.activeIndex].lowGetter[props.throttleCount - 1] + 0.05).toFixed(2) }
                </h1>
            </div>
        </div>
    );
};

export default BaseThrottleConfig;
