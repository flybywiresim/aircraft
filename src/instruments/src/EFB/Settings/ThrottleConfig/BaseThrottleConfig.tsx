import React from 'react';
import { useSimVar } from '../../../Common/simVars';
import DetentConfig from './DetentConfig';

interface Props {
    throttleNumber: string,
    throttleCount: number,
    values: Array<any>,
}

class ThrottleSimvar {
    readableName: string;

    technicalName: string;

    hiSetter: Array<any>;

    hiGetter: Array<any>;

    lowSetter: Array<any>;

    lowGetter: Array<any>;

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
                        console.log(`HHII${m.hiSetter}`);
                        console.log(`Low${m.lowSetter}`);

                        const [lowValue, setLowValue] = m.lowSetter;
                        console.log(`LLOOOOL${m.lowSetter[1]}`);

                        const [hiValue, setHiValue] = m.hiSetter;
                        return (
                            <div className="divide-y divide-gray-700 ">
                                <span className="text-lg text-gray-300">{lowValue}</span>

                                <DetentConfig text={m.readableName} fromVar={setLowValue} toVar={setHiValue} throttleNumber={props.throttleNumber} values={props.values} />

                            </div>
                        );
                    })}

                    {/*                   <div className="divide-y divide-gray-700 flex flex-col">
                        <span className="text-lg text-gray-300">{throttleRevIdle.toFixed(2)}</span>

                        <div className="mb-4 flex flex-row justify-between items-center">
                            <Button className="w-full" text="REV Idle" onClick={() => setThrottleRevIdle(throttle1Position)} />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-700 flex flex-col">
                        <span className="text-lg text-gray-300">{throttleIdle.toFixed(2)}</span>

                        <div className="mb-4 flex flex-row justify-between items-center">
                            <Button className="w-full" text="Idle" onClick={() => setThrottleIdle(throttle1Position)} />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-700 flex flex-col">
                        <span className="text-lg text-gray-300">{throttleClb.toFixed(2)}</span>

                        <div className="mb-4 flex flex-row justify-between items-center">
                            <Button className="w-full" text="CLB" onClick={() => setThrottleClb(throttle1Position)} />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-700 flex flex-col">
                        <span className="text-lg text-gray-300">{throttleFlex.toFixed(2)}</span>
                        <div className="mb-4 flex flex-row justify-between items-center">
                            <Button className="w-full" text="FLEX" onClick={() => setThrottleFlex(throttle1Position)} />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-700 flex flex-col">
                        <span className="text-lg text-gray-300">{throttleToga.toFixed(2)}</span>
                        <div className="mb-4 flex flex-row justify-between items-center">
                            <Button className="w-full" text="TOGA" onClick={() => setThrottleToga(throttle1Position)} />
                        </div>
                    </div> */}
                </div>
            </div>
        </div>

    );
};

export default BaseThrottleConfig;
