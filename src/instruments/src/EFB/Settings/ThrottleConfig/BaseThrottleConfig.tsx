import React from 'react';
import Button from '../../Components/Button/Button';
import { useSimVar } from '../../../Common/simVars';

interface Props {
    throttleNumber: string
}

const BaseThrottleConfig: React.FC<Props> = (props: Props) => {
    const [throttleRev, setThrottleRev] = useSimVar(`L:A32NX_THROTTLE_${props.throttleNumber}_DETENT_REV`, 'number');
    const [throttleRevIdle, setThrottleRevIdle] = useSimVar(`L:A32NX_THROTTLE_${props.throttleNumber}_DETENT_REV_IDLE`, 'number');

    const [throttleIdle, setThrottleIdle] = useSimVar(`L:A32NX_THROTTLE_${props.throttleNumber}_DETENT_IDLE`, 'number');
    const [throttleClb, setThrottleClb] = useSimVar(`L:A32NX_THROTTLE_${props.throttleNumber}_DETENT_CLB`, 'number');
    const [throttleFlex, setThrottleFlex] = useSimVar(`L:A32NX_THROTTLE_${props.throttleNumber}_DETENT_FLEX`, 'number');
    const [throttleToga, setThrottleToga] = useSimVar(`L:A32NX_THROTTLE_${props.throttleNumber}_DETENT_TOGA`, 'number');
    const [throttle1Position] = useSimVar(`GENERAL ENG THROTTLE LEVER POSITION:${props.throttleNumber}`, 'number');

    return (

        <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
                <div className="justify-between items-center">
                    <div className="divide-y divide-gray-700 ">
                        <span className="text-lg text-gray-300">{throttleRev.toFixed(2)}</span>

                        <div className="mb-4  justify-between items-center">
                            <Button className="w-full" text="REV" onClick={() => setThrottleRev(throttle1Position)} />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-700 flex flex-col">
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
                    </div>
                </div>
            </div>
        </div>

    );
};

export default BaseThrottleConfig;
