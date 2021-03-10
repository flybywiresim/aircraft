import React, { useEffect } from 'react';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';

import BaseThrottleConfig from './BaseThrottleConfig';

interface Props {
    isShown: boolean,
    onClose: any
}

const ThrottleConfig: React.FC<Props> = (props: Props) => {
    if (!props.isShown) {
        return null;
    }

    return (
        <div className="flex flex-col-2 justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="flex flex-row justify-center">
                <BaseThrottleConfig throttleNumber="1" throttleCount={1} />
                <BaseThrottleConfig throttleNumber="2" throttleCount={1} />
            </div>

            <div className="bg-gray-800  px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                    text="Close"
                    type={BUTTON_TYPE.GREEN_OUTLINE}
                    onClick={props.onClose}
                />
                <Button
                    text="Save"
                    type={BUTTON_TYPE.GREEN_OUTLINE}
                    onClick={props.onClose}
                />
            </div>
        </div>
    );
};

export default ThrottleConfig;
