import React from 'react';
import { useSimVar } from '../../../Common/simVars';
import DetentConfig from './DetentConfig';

interface Props {
    throttleNumber: number,
    throttleCount: number,
    mappingsAxisOne: ThrottleSimvar[],
    mappingsAxisTwo?: ThrottleSimvar[]
    activeIndex: number,
    disabled: boolean,
}

export class ThrottleSimvar {
    readableName: string;

    technicalName: string;

    hiValue: Array<any>;

    lowValue;

    deadZone: number;

    getHiGetter = () => this.hiValue[0]

    getHiSetter = () => this.hiValue[1]

    getLowGetter = () => this.lowValue[0]

    getLowSetter = () => this.lowValue[1]

    constructor(readableName: string, technicalName: string, throttleNumber: number) {
        this.readableName = readableName;
        this.technicalName = technicalName;
        this.deadZone = 0.05;
        this.hiValue = useSimVar(`${technicalName}HIGH:${throttleNumber}`, 'number', 100);
        this.lowValue = useSimVar(`${technicalName}LOW:${throttleNumber}`, 'number', 100);
    }
}

const BaseThrottleConfig: React.FC<Props> = (props: Props) => {
    const [throttlePosition] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${props.throttleNumber}`, 'number', 50);

    /*    for (const mapped of mappings) {
        for (let index = 1; index <= props.throttleCount; index++) {
            const throttleNumber: number = props.throttleCount > 1 ? index : props.throttleNumber;

            mapped.hiGetter.push(useSimVar(`${mapped.technicalName}HIGH:${throttleNumber}`, 'number', 100)[0]);
            mapped.hiSetter.push(useSimVar(`${mapped.technicalName}HIGH:${throttleNumber}`, 'number', 100)[1]);

            mapped.lowGetter.push(useSimVar(`${mapped.technicalName}LOW:${throttleNumber}`, 'number', 100)[0]);
            mapped.lowSetter.push(useSimVar(`${mapped.technicalName}LOW:${throttleNumber}`, 'number', 100)[1]);
        }
    } */

    const currentDetent = (
        <DetentConfig
            key={props.activeIndex}
            index={props.activeIndex}
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
        />
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
            </div>
        </div>
    );
};

export default BaseThrottleConfig;
