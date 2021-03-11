import React, { useState } from 'react';

import { useSimVar } from '../../../Common/simVars';
import Button from '../../Components/Button/Button';

interface Props {
    fromVar,
    toVar,
    throttleNumber,
    text,
}

type DetentConfigState = {
    DETENT_FROM_SET: boolean,
    DETENT_TO_SET: boolean,
    RESET,
}

const DetentConfig: React.FC<Props> = (props: Props) => {
    const [throttle1Position] = useSimVar(`L:A32NX_THROTTLE_MAPPING_INPUT:${props.throttleNumber}`, 'number', 500);
    // console.log(`THROT 1 ${throttle1Position}`);

    const [state, setState] = useState<DetentConfigState>({ DETENT_FROM_SET: false, DETENT_TO_SET: false, RESET: false });

    const setFromTo = (throttle1Position, fromVar, toVar) => {
        if (!state.DETENT_FROM_SET) {
            fromVar.forEach((f) => f(throttle1Position));
            setState({ ...state, DETENT_FROM_SET: true });
        } else if (!state.DETENT_TO_SET) {
            toVar.forEach((f) => f(throttle1Position));
            setState({ ...state, DETENT_TO_SET: true });
        } else {
            setState({ DETENT_FROM_SET: false, DETENT_TO_SET: false, RESET: true });
        }
    };

    return (
        <div className="mb-4 w-56 justify-between items-center">
            <Button className="w-full" text={!state.DETENT_FROM_SET ? `${props.text} - from` : `${props.text} - to`} onClick={() => setFromTo(throttle1Position, props.fromVar, props.toVar)} />
        </div>
    );
};

export default DetentConfig;
