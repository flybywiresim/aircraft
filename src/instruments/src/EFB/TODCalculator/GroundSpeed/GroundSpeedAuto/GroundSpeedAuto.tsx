import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'instruments/src/EFB/Store/store';
import { removeTodGroundSpeed, setTodGroundSpeed, setTodGroundSpeedMode } from '../../../Store/features/todCalculator';
import Button, { BUTTON_TYPE } from '../../../Components/Button/Button';
import { TOD_INPUT_MODE } from '../../../Enum/TODInputMode';
import { useSimVar } from '../../../../Common/simVars';

import './GroundSpeedAuto.scss';

const GroundSpeedAuto = () => {
    const dispatch = useAppDispatch();

    const currentAltitude = useAppSelector((state) => state.todCalculator.currentAltitude);
    const groundSpeedData = useAppSelector((state) => state.todCalculator.groundSpeed);
    const { groundSpeed } = groundSpeedData[groundSpeedData.length - 1];

    let [simGroundSpeed] = useSimVar('GPS GROUND SPEED', 'knots', 1_000);
    simGroundSpeed = Math.round(simGroundSpeed);

    const setCurrentGroundSpeed = () => {
        // FIXME
        if ((currentAltitude ?? 0) > 10000 && (groundSpeed ?? 0) >= 250) {
            dispatch(setTodGroundSpeed({
                index: 0,
                value: { from: 0, groundSpeed: 250 },
            }));
            dispatch(setTodGroundSpeed({ index: 1, value: { from: 10000, groundSpeed: simGroundSpeed } }));
        } else {
            dispatch(setTodGroundSpeed({ index: 0, value: { from: 0, groundSpeed: simGroundSpeed > 0 ? simGroundSpeed : '' } }));
            removeTodGroundSpeed(1);
        }
    };

    useEffect(() => {
        setCurrentGroundSpeed();
    }, [currentAltitude, simGroundSpeed]);

    if (Number.isNaN(groundSpeed)) {
        return null;
    }

    return (
        <div>
            <div className="flex flex-col justify-center items-center">
                <span className="mb-4 text-xl font-medium">Fetching from sim</span>

                <span className="mb-4 text-5xl font-medium">
                    {groundSpeed || 0}
                    {' '}
                    kt
                </span>

                <Button text="Manual input" onClick={() => setTodGroundSpeedMode(TOD_INPUT_MODE.MANUAL)} type={BUTTON_TYPE.BLUE} />
            </div>
        </div>
    );
};

export default GroundSpeedAuto;
