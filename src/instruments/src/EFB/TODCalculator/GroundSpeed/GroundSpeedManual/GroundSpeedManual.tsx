/* eslint-disable max-len */
import React from 'react';

import { useAppDispatch, useAppSelector } from '../../../Store/store';

import { setTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeedMode, addTodGroundSpeed } from '../../../Store/features/todCalculator';
import { TOD_INPUT_MODE } from '../../../Enum/TODInputMode';

import Button, { BUTTON_TYPE } from '../../../UtilComponents/Button/Button';
import Divider from '../../../UtilComponents/Divider/Divider';

import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';

export const GroundSpeedManual = () => {
    const dispatch = useAppDispatch();
    const groundSpeed = useAppSelector((state) => state.todCalculator.groundSpeed);

    return (
        <div className="flex flex-col justify-between space-y-12 h-full">
            <div className="space-y-6">
                <div className="space-y-4">
                    {groundSpeed.map(({ from, groundSpeed }, index) => (
                        <div className="flex flex-row space-x-4 w-full rounded-lg">
                            <div>
                                <p>{`Min. Altitude ${index + 1}`}</p>
                                <SimpleInput
                                    placeholder="feet"
                                    number
                                    className="w-full"
                                    value={from}
                                    disabled={index === 0}
                                    onChange={(from) => dispatch(setTodGroundSpeed({
                                        index,
                                        value: {
                                            from: Number.parseFloat(from),
                                            groundSpeed,
                                        },
                                    }))}
                                />
                            </div>

                            <div>
                                <p>Ground Speed</p>
                                <SimpleInput
                                    number
                                    className="w-full"
                                    placeholder="knots"
                                    value={groundSpeed}
                                    onChange={(groundSpeed) => dispatch(setTodGroundSpeed({
                                        index,
                                        value: {
                                            from,
                                            groundSpeed: Number.parseInt(groundSpeed),
                                        },
                                    }))}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-row space-x-2">
                    <button
                        className={`w-full py-2 rounded-md bg-red-500 text-theme-body border-2 border-red-500 transition duration-100 ${groundSpeed.length <= 1 ? 'opacity-60' : 'hover:bg-theme-body hover:text-red-500'}`}
                        type="button"
                        onClick={() => dispatch(removeTodGroundSpeed(groundSpeed.length - 1))}
                        disabled={groundSpeed.length <= 1}
                    >
                        Remove Last
                    </button>

                    <button
                        className={`w-full py-2 bg-colors-lime-500 text-theme-body rounded-md transition duration-100 border-2 border-colors-lime-500 ${groundSpeed.length >= 6 ? 'opacity-60' : 'hover:text-colors-lime-500 hover:bg-theme-body'}`}
                        type="button"
                        onClick={() => dispatch(addTodGroundSpeed({ from: -1, groundSpeed: -1 }))}
                        disabled={groundSpeed.length >= 6}
                    >
                        Add
                    </button>
                </div>
            </div>

            <button
                type="button"
                className="flex justify-center p-3 w-full text-theme-highlight hover:text-theme-body hover:bg-theme-highlight rounded-md border-2 border-theme-highlight transition duration-100"
                onClick={() => dispatch(setTodGroundSpeedMode(TOD_INPUT_MODE.AUTO))}
            >
                <p className="text-current">SYNC</p>
            </button>
        </div>
    );
};
