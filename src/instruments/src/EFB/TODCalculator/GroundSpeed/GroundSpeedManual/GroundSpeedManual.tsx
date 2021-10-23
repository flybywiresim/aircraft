import React from 'react';

import { useAppDispatch, useAppSelector } from '../../../Store/store';

import { setTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeedMode, addTodGroundSpeed } from '../../../Store/features/todCalculator';
import { TOD_INPUT_MODE } from '../../../Enum/TODInputMode';

import Input from '../../../Components/Form/Input/Input';
import Button, { BUTTON_TYPE } from '../../../Components/Button/Button';
import Divider from '../../../Components/Divider/Divider';

import './GroundSpeedManual.scss';

const GroundSpeedManual = () => {
    const dispatch = useAppDispatch();
    const groundSpeed = useAppSelector((state) => state.todCalculator.groundSpeed);

    return (
        <div>
            <div className="mb-4 ground-speed-container">
                {groundSpeed.map(({ from, groundSpeed }, index) => (
                    <div className="flex mb-4 w-full rounded-lg bg-blue-darker">
                        <Input
                            label={`Min. Alt ${index + 1}`}
                            type="number"
                            className="mr-4 w-6/12 dark-option"
                            value={from}
                            rightComponent={<span className="text-2xl">ft</span>}
                            disabled={index === 0}
                            onChange={(from) => dispatch(setTodGroundSpeed({
                                index,
                                value: {
                                    from: Number.parseFloat(from),
                                    groundSpeed,
                                },
                            }))}
                        />

                        <Input
                            label="GS"
                            type="number"
                            className="w-6/12 dark-option"
                            rightComponent={<span className="text-2xl">kt</span>}
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
                ))}
            </div>

            <div className="flex flex-row justify-end mb-4">
                {groundSpeed.length > 1 && (
                    <Button text="Remove last" type={BUTTON_TYPE.RED} onClick={() => dispatch(removeTodGroundSpeed(groundSpeed.length - 1))} />
                )}

                {groundSpeed.length < 6 && (
                    // FIXME
                    <Button className="ml-4" text="Add" type={BUTTON_TYPE.GREEN} onClick={() => dispatch(addTodGroundSpeed({ from: -1, groundSpeed: -1 }))} />
                )}
            </div>

            <Divider className="mb-4" />

            <div className="flex flex-row justify-center">
                <Button
                text="SYNC"
                type={BUTTON_TYPE.BLUE_OUTLINE}
                onClick={() => dispatch(setTodGroundSpeedMode(TOD_INPUT_MODE.AUTO))}
            />
            </div>
        </div>
    );
};

export default GroundSpeedManual;
