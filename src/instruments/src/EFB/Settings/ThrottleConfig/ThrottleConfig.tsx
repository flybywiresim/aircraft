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
                <BaseThrottleConfig throttleNumber="2" />
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
/*    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" />
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div
                    className="inline-block align-bottom bg-gray-800 rounded-xl px-6 py-4 shadow-lg rounded-lg text-left overflow-hidden
            shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-headline"
                >

                    <div className=" flex flex-row justify-between items-center">
                        <BaseThrottleConfig throttleNumber="1" />
                        <BaseThrottleConfig throttleNumber="2" />
                    </div>

                    <div className="bg-gray-800  px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <Button
                            text="Close"
                            type={BUTTON_TYPE.GREEN_OUTLINE}
                            onClick={props.onClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}; */

export default ThrottleConfig;
