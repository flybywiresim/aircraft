import React from 'react';
import { useSimVar } from '../../../Common/simVars';
import DetentConfig from './DetentConfig';

interface Props {
    throttleNumber: string,
    throttleCount: number,
}

class ThrottleSimvar {
    readableName: string;

    technicalName: string;

    hiSetter: Array<any>;

    lowSetter: Array<any>;

    constructor(readableName: string, technicalName: string) {
        this.readableName = readableName;
        this.technicalName = technicalName;
        this.hiSetter = [];
        this.lowSetter = [];
    }
}

const BaseThrottleConfig: React.FC<Props> = (props: Props) => {
    // const throts = new Map<String, Array<[any, (newValueOrSetter) => void]>>();

    const mappings: Array<ThrottleSimvar> = [
        new ThrottleSimvar('Reverse', 'A32NX_THROTTLE_MAPPING_REVERSE_'),
        new ThrottleSimvar('Reverse Idle', 'A32NX_THROTTLE_MAPPING_REVERSE_IDLE_'),
        new ThrottleSimvar('Idle', 'A32NX_THROTTLE_MAPPING_IDLE_'),
        new ThrottleSimvar('Climb', 'A32NX_THROTTLE_MAPPING_CLIMB_'),
        new ThrottleSimvar('Flex', 'A32NX_THROTTLE_MAPPING_FLEXMCT_'),
        new ThrottleSimvar('Toga', 'A32NX_THROTTLE_MAPPING_TOGA_'),
    ];

    for (const mapped of mappings) {
        for (let index = 0; index < props.throttleCount; index++) {
            const throttleNumber = props.throttleCount > 1 ? index : props.throttleNumber;
            mapped.hiSetter.push(useSimVar(`${mapped.technicalName}_HIGH:${throttleNumber}`, 'number')[0]);
            mapped.lowSetter.push(useSimVar(`${mapped.technicalName}_LOW:${throttleNumber}`, 'number'));
        }
    }

    /*   for (const s in mappings) {
            if (throts.has(s)) {
                throts.get(s)?.push(useSimVar(s + throttleNumber, 'number'));
                mappedMappings.push(new)
            } else {
                throts.set(s, [useSimVar(s + throttleNumber, 'number')]);
            }
        }
 */

    return (

        <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 mt-4 mb-4">
            <div className="sm:flex sm:items-start">
                <div className="justify-between items-center">

                    {mappings.map((m) => {
                        const [lowValue, setLowValue] = m.lowSetter;
                        console.log(`Lower boundary: ${lowValue}`);
                        console.log(`Higher boundary: ${lowValue}`);

                        const [hiValue, setHiValue] = m.hiSetter;
                        return (
                            <div className="divide-y divide-gray-700 ">
                                <span className="text-lg text-gray-300">{lowValue}</span>

                                <DetentConfig text={m.readableName} fromVar={setLowValue} toVar={setHiValue} throttleNumber={props.throttleNumber} />

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

    );
};

export default BaseThrottleConfig;
