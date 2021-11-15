import { connect } from 'react-redux';
import React from 'react';
import Input from '../../../Components/Form/Input/Input';
import { TOD_CALCULATOR_REDUCER } from '../../../Store';
import {
    addTodGroundSpeed,
    removeTodGroundSpeed,
    setTodGroundSpeed,
    setTodGroundSpeedMode,
} from '../../../Store/action-creator/tod-calculator';

import './GroundSpeedManual.scss';
import Button, { BUTTON_TYPE } from '../../../Components/Button/Button';
import Divider from '../../../Components/Divider/Divider';
import { TOD_INPUT_MODE } from '../../../Enum/TODInputMode.enum';

const GroundSpeedManual = ({ groundSpeed, addTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeed, setTodGroundSpeedMode, ...props }) => (
    <div {...props}>
        <div className="ground-speed-container mb-4">
            {groundSpeed.map(({ from, groundSpeed }, key) => (
                <div className="flex w-full mb-4 bg-blue-darker rounded-lg">
                    <Input
                        label={`Min. Alt ${key + 1}`}
                        type="number"
                        className="dark-option w-6/12 mr-4"
                        value={from}
                        rightComponent={<span className="text-2xl">ft</span>}
                        disabled={key === 0}
                        onChange={(from) => setTodGroundSpeed(key, { from })}
                    />

                    <Input
                        label="GS"
                        type="number"
                        className="dark-option w-6/12"
                        rightComponent={<span className="text-2xl">kt</span>}
                        value={groundSpeed}
                        onChange={(groundSpeed) => setTodGroundSpeed(key, { groundSpeed })}
                    />
                </div>
            ))}
        </div>

        <div className="flex flex-row justify-end mb-4">
            {groundSpeed.length > 1 && (
                <Button text="Remove last" type={BUTTON_TYPE.RED} onClick={() => removeTodGroundSpeed(groundSpeed.length - 1)} />
            )}

            {groundSpeed.length < 6 && (
                <Button className="ml-4" text="Add" type={BUTTON_TYPE.GREEN} onClick={() => addTodGroundSpeed({ from: undefined, groundSpeed: undefined })} />
            )}
        </div>

        <Divider className="mb-4" />

        <div className="flex flex-row justify-center">
            <Button
                text="SYNC"
                type={BUTTON_TYPE.BLUE_OUTLINE}
                onClick={() => {
                    setTodGroundSpeedMode(TOD_INPUT_MODE.AUTO);
                    Coherent.trigger('UNFOCUS_INPUT_FIELD');
                }}
            />
        </div>
    </div>
);

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { groundSpeed, groundSpeedMode } }) => ({ groundSpeed, groundSpeedMode }),
    { addTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeed, setTodGroundSpeedMode },
)(GroundSpeedManual);
