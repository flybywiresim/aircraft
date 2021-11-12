import { connect } from 'react-redux';
import React, { useEffect } from 'react';
import { round, isNaN, last } from 'lodash';
import { TOD_CALCULATOR_REDUCER } from '../../../Store';
import {
    removeTodGroundSpeed,
    setTodGroundSpeed,
    setTodGroundSpeedMode,
} from '../../../Store/action-creator/tod-calculator';
import './GroundSpeedAuto.scss';
import Button, { BUTTON_TYPE } from '../../../Components/Button/Button';
import { TOD_INPUT_MODE } from '../../../Enum/TODInputMode.enum';
import { useSimVar } from '../../../../Common/simVars';

const GroundSpeedAuto = ({ groundSpeedData, currentAltitude, setTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeedMode, ...props }) => {
    let [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    simGroundSpeed = round(simGroundSpeed);

    const { groundSpeed } = last(groundSpeedData);

    useEffect(() => {
        if (currentAltitude > 10000 && groundSpeed >= 250) {
            setTodGroundSpeed(0, { from: 0, groundSpeed: 250 });
            setTodGroundSpeed(1, { from: 10000, groundSpeed: simGroundSpeed });
        } else {
            setTodGroundSpeed(0, { from: 0, groundSpeed: simGroundSpeed > 0 ? simGroundSpeed : '' });
            removeTodGroundSpeed(1);
        }
    }, [currentAltitude, groundSpeed, removeTodGroundSpeed, setTodGroundSpeed, simGroundSpeed]);

    if (isNaN(groundSpeed)) {
        return null;
    }

    return (
        <div {...props}>
            <div className="flex flex-col items-center justify-center">
                <span className="font-medium mb-4 text-xl">Fetching from sim</span>

                <span className="font-medium mb-4 text-5xl">
                    {groundSpeed || 0}
                    {' '}
                    kt
                </span>

                <Button text="Manual input" onClick={() => setTodGroundSpeedMode(TOD_INPUT_MODE.MANUAL)} type={BUTTON_TYPE.BLUE} />
            </div>
        </div>
    );
};

export default connect(
    ({ [TOD_CALCULATOR_REDUCER]: { groundSpeed, currentAltitude } }) => ({ groundSpeedData: groundSpeed, currentAltitude }),
    { setTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeedMode },
)(GroundSpeedAuto);
