import React, { useState } from 'react';

import { useSimVar } from '../../../Common/simVars';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';
import Input from '../../Components/Form/Input/Input';

interface Props {
    detentSetting,
    detentValue: number,
    throttleNumber,
    throttlePosition,
    text,
}

type DetentConfigState = {
    DETENT_FROM_SET: boolean,
    DETENT_TO_SET: boolean,
    RESET,
}

const DetentConfig: React.FC<Props> = (props: Props) => {
    const [state, setState] = useState<DetentConfigState>({ DETENT_FROM_SET: false, DETENT_TO_SET: false, RESET: false });

    const applyButtonStateStyling = (state: DetentConfigState) => {
        if (state.DETENT_FROM_SET && !state.RESET) {
            return 'w-full bg-yellow-500 border-yellow-500 hover:bg-yellow-600 hover:border-yellow-600 mr-4';
        }
        if (state.RESET) {
            return 'w-full border-green-500 bg-green-500 hover:bg-grey-600 hover:border-grey-600 mr-4';
        }
        return 'w-full border-blue-500 bg-blue-500 hover:bg-blue-600 hover:border-blue-600 mr-4';
    };

    const setFromTo = (throttle1Position, setting, overrideValue?: string) => {
        /*   if (!state.DETENT_FROM_SET) {
            fromVar.forEach((f) => f(throttle1Position));
            setState({ ...state, DETENT_FROM_SET: true, RESET: false });
        } else if (!state.DETENT_TO_SET) {
            toVar.forEach((f) => f(throttle1Position));
            setState({ ...state, DETENT_TO_SET: true, RESET: true });
        } else {
            setState({ DETENT_FROM_SET: false, DETENT_TO_SET: false, RESET: false });
        } */
        const newSetting = overrideValue || throttle1Position;
        console.log(`setting${newSetting}`);
        setting.forEach((f) => f(newSetting));
    };

    return (
        <div className="mb-4 w-56 justify-between items-center mr-4 p-4">
            <h1 className="text-xl text-white mb-2">{props.text}</h1>
            <Input
                // label={props.text}
                type="number"
                className="dark-option mb-4"
                value={props.detentValue !== undefined ? props.detentValue.toFixed(2) : props.detentValue}
                onChange={(from) => setFromTo(props.detentValue, props.detentSetting, from)}
            />
            <Button
                className={applyButtonStateStyling(state)}
                text="Set"
                onClick={() => setFromTo(props.throttlePosition, props.detentSetting)}
                type={BUTTON_TYPE.NONE}
            />
        </div>
    );
};

export default DetentConfig;
